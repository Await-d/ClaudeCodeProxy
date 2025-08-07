namespace ClaudeCodeProxy.Domain;

public class ClaudeAiOauth
{
    public string AccessToken { get; set; } = string.Empty;
    
    public string RefreshToken { get; set; } = string.Empty;
    
    public long ExpiresAt { get; set; }
    
    public string[] scopes { get; set; } = Array.Empty<string>();
    
    public bool isMax { get; set; }
}