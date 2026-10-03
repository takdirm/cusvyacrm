namespace Cusvya.Services.Template.Auth;

public sealed class FirebaseOptions
{
    public const string SectionName = "Firebase";
    public string ProjectId { get; set; } = string.Empty;
    public string ServiceAccountJson { get; set; } = string.Empty;
    public string ServiceAccountFilePath { get; set; } = string.Empty;
}
