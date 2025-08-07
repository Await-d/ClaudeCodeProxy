﻿using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ClaudeCodeProxy.Abstraction;
using ClaudeCodeProxy.Abstraction.Chats;
using ClaudeCodeProxy.Core.Extensions;
using ClaudeCodeProxy.Domain;
using Microsoft.Extensions.Logging;
using Thor.Abstractions;
using Thor.Abstractions.Anthropic;

namespace ClaudeCodeProxy.Core.AI;

public class AnthropicChatService(ILogger<AnthropicChatService> logger) : IAnthropicChatCompletionsService
{
    public async Task<ClaudeChatCompletionDto> ChatCompletionsAsync(AnthropicInput input,
        Dictionary<string, string> headers,
        ProxyConfig? config,
        ThorPlatformOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        using var openai =
            Activity.Current?.Source.StartActivity("Claudia 对话补全");

        if (string.IsNullOrEmpty(options.Address))
        {
            options.Address = "https://api.anthropic.com/";
        }

        var client = HttpClientFactory.GetHttpClient(options.Address, config);

        var url = new Uri(options.Address);
        headers["Host"] = url.Host;

        var response =
            await client.PostJsonAsync(options.Address.TrimEnd('/') + "/v1/messages?beta=true", input, string.Empty,
                headers);

        openai?.SetTag("Model", input.Model);
        openai?.SetTag("Response", response.StatusCode.ToString());

        // 大于等于400的状态码都认为是异常
        if (response.StatusCode >= HttpStatusCode.BadRequest)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            logger.LogError("Claude对话异常 请求地址：{Address}, StatusCode: {StatusCode} Response: {Response}", options.Address,
                response.StatusCode, error);

            // 特殊处理429限流错误
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                var retryAfter = response.Headers.RetryAfter?.Delta?.TotalSeconds ?? 60; // 默认60秒
                var rateLimitInfo = new RateLimitInfo
                {
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = error,
                    RetryAfterSeconds = (int)retryAfter,
                    Timestamp = DateTime.Now
                };
                
                logger.LogWarning("Claude账户达到限流，需要等待 {RetryAfter} 秒。错误信息：{Error}", 
                    retryAfter, error);
                
                throw new RateLimitException("Claude账户达到限流", rateLimitInfo);
            }

            throw new Exception("Claude对话异常" + error);
        }

        var value =
            await response.Content.ReadFromJsonAsync<ClaudeChatCompletionDto>(ThorJsonSerializer.DefaultOptions,
                cancellationToken: cancellationToken);

        return value;
    }

    public async IAsyncEnumerable<(string, string, ClaudeStreamDto?)> StreamChatCompletionsAsync(AnthropicInput input,
        Dictionary<string, string> headers,
        ProxyConfig? config,
        ThorPlatformOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        using var openai =
            Activity.Current?.Source.StartActivity("Claudia 对话补全");

        if (string.IsNullOrEmpty(options.Address))
        {
            options.Address = "https://api.anthropic.com/";
        }

        var client = HttpClientFactory.GetHttpClient(options.Address, config);

        var url = new Uri(options.Address);
        headers["Host"] = url.Host;

        var response = await client.HttpRequestRaw(options.Address.TrimEnd('/') + "/v1/messages?beta=true", input,
            string.Empty,
            headers);

        openai?.SetTag("Model", input.Model);
        openai?.SetTag("Response", response.StatusCode.ToString());

        // 大于等于400的状态码都认为是异常
        if (response.StatusCode >= HttpStatusCode.BadRequest)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            logger.LogError("OpenAI对话异常 请求地址：{Address}, StatusCode: {StatusCode} Response: {Response}", options.Address.TrimEnd('/') + "/v1/messages?beta=true",
                response.StatusCode, error);

            throw new Exception("OpenAI对话异常" + error);
        }

        using var stream = new StreamReader(await response.Content.ReadAsStreamAsync(cancellationToken));

        using StreamReader reader = new(await response.Content.ReadAsStreamAsync(cancellationToken));
        string? line = string.Empty;
        string? data = null;

        string eventType = string.Empty;

        while ((line = await reader.ReadLineAsync(cancellationToken).ConfigureAwait(false)) != null)
        {
            line += Environment.NewLine;

            if (line.StartsWith('{'))
            {
                logger.LogInformation("OpenAI对话异常 , StatusCode: {StatusCode} Response: {Response}", response.StatusCode,
                    line);

                throw new Exception("OpenAI对话异常" + line);
            }

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            if (line.StartsWith("event:"))
            {
                eventType = line;
                continue;
            }

            if (!line.StartsWith(OpenAIConstant.Data)) continue;

            data = line[OpenAIConstant.Data.Length..].Trim();

            var result = JsonSerializer.Deserialize<ClaudeStreamDto>(data,
                ThorJsonSerializer.DefaultOptions);

            yield return (eventType, line, result);
        }
    }
}