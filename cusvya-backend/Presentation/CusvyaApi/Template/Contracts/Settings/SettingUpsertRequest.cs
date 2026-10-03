using System.ComponentModel.DataAnnotations;

namespace Cusvya.Api.Template.Contracts.Settings;

/// <summary>
/// Payload used to create or update an application setting.
/// </summary>
public sealed record SettingUpsertRequest
{
    [Required, MaxLength(120)]
    public required string Key { get; init; }

    [Required, MaxLength(4000)]
    public required string Value { get; init; }

    [MaxLength(500)]
    public string Description { get; init; } = string.Empty;
}
