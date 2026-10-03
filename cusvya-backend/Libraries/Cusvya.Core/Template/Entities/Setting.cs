using System.ComponentModel.DataAnnotations;

namespace Cusvya.Core.Template.Entities;

public sealed class Setting : BaseEntity
{
    [Required, MaxLength(120)]
    public string Key { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Value { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
}

