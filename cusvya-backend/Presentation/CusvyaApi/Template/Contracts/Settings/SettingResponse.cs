namespace Cusvya.Api.Template.Contracts.Settings;

/// <summary>
/// Application setting resource returned by the API.
/// </summary>
public sealed record SettingResponse(
    int Id,
    string Key,
    string Value,
    string Description,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);

