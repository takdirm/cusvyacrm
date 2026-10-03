using Cusvya.Core.Template.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cusvya.Data.Template;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Setting> Settings => Set<Setting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.FirebaseUid).IsUnique();
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customers");
            entity.HasIndex(x => x.PhoneNumber).IsUnique();
            entity.HasIndex(x => x.FirebaseUid).IsUnique();
        });

        modelBuilder.Entity<Setting>(entity =>
        {
            entity.ToTable("Settings");
            entity.HasIndex(x => x.Key).IsUnique();
        });
    }
}

