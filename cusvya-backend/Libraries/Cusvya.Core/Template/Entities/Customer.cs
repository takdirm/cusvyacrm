using System.ComponentModel.DataAnnotations;

namespace Cusvya.Core.Template.Entities;

public sealed class Customer : BaseEntity
{
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required, MaxLength(128)]
    public string FirebaseUid { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

