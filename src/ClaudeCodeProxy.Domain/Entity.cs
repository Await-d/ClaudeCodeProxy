namespace ClaudeCodeProxy.Domain;

public abstract class Entity<TKey> : IAuditable
{
    public TKey Id { get; set; } = default!;

    public DateTime CreatedAt { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime? ModifiedAt { get; set; }

    public string? ModifiedBy { get; set; }
}