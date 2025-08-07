using BenchmarkDotNet.Running;
using ClaudeCodeProxy.PerformanceTests.Benchmarks;

namespace ClaudeCodeProxy.PerformanceTests;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("🚀 ClaudeCodeProxy Performance Benchmarks");
        Console.WriteLine("==========================================");
        
        // 如果有命令行参数，运行指定的基准测试
        if (args.Length > 0)
        {
            switch (args[0].ToLowerInvariant())
            {
                case "permission":
                case "permissions":
                    BenchmarkRunner.Run<PermissionServiceBenchmarks>();
                    break;
                case "all":
                default:
                    RunAllBenchmarks();
                    break;
            }
        }
        else
        {
            // 默认运行所有基准测试
            RunAllBenchmarks();
        }
    }

    private static void RunAllBenchmarks()
    {
        Console.WriteLine("Running all performance benchmarks...");
        
        // 运行权限服务基准测试
        Console.WriteLine("\n📊 Running Permission Service Benchmarks...");
        BenchmarkRunner.Run<PermissionServiceBenchmarks>();
        
        Console.WriteLine("\n✅ All benchmarks completed!");
        Console.WriteLine("Results have been saved to ./BenchmarkDotNet.Artifacts/");
    }
}