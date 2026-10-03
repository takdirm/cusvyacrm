using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Scootr.Core.Domain.Customers; // For Customer, Address, CustomerAddress, CustomerBooking
using Scootr.Core.Domain.Plans;
using Scootr.Core.Domain.Stations;
using Scootr.Core.Domain.Users; // For User
using Scootr.Core.Domain.Vehicles;
using Scootr.Core.Domain.Vendors;
using Scootr.Core.Domain.Settings;
using Scootr.Core.Domain.Billings;
using Scootr.Core.Domain.Billing;
using Scootr.Core.Domain.Reviews;
using Scootr.Core.Domain.Gprs;
using Scootr.Core.Domain.Documents;
using Scootr.Core.Domain.Notifications;
using Scootr.Core.Domain.Regions;
using Razorpay.Api;
using Invoice = Scootr.Core.Domain.Billings.Invoice;
using Customer = Scootr.Core.Domain.Customers.Customer;
using Subscription = Scootr.Core.Domain.Billings.Subscription;
using Payment = Scootr.Core.Domain.Billings.Payment;



namespace Scootr.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> opt) : base(opt) { }



        public DbSet<Review> Reviews { get; set; } = null!;
        public DbSet<Customer> Customers { get; set; } = null!;
      
        public DbSet<Payment> Payments { get; set; } = null!; // <-- Added
        public DbSet<User> Users { get; set; } = null!; // Add this line
        public DbSet<Subscription> Subscriptions { get; set; }

        public DbSet<Setting> Settings { get; set; } = null!;
        public DbSet<Region> Regions { get; set; } = null!;

       
        public DbSet<CustomerBilling> CustomerBillings { get; set; } = null!;

        public DbSet<Invoice> Invoices { get; set; } = null!;

        public DbSet<Charge> Charges { get; set; } = null!; // For PostpaidBillingService

        public DbSet<PaymentOrder> PaymentOrders { get; set; } = null!; // For PaymentOrder entity

        // Arrears
        public DbSet<Arrears> Arrears { get; set; } = null!;

        // Vehicles
        public DbSet<Vehicle> Vehicles { get; set; } = null!;
        public DbSet<TrackerDevice> TrackerDevices { get; set; } = null!;
        public DbSet<VehicleModel> VehicleModels { get; set; } = null!;
        public DbSet<VehicleFeature> VehicleFeatures { get; set; } = null!;
        public DbSet<VehicleTypeRentalPlan> VehicleTypeRentalPlans { get; set; } = null!;
        public DbSet<VehicleTypeOwnershipPlan> VehicleTypeOwnershipPlans { get; set; } = null!;
        public DbSet<VehicleCatalogue> VehicleCatalogues { get; set; } = null!;
        public DbSet<CatalogueVendor> CatalogueVendors { get; set; } = null!;
        public DbSet<CatalogueColor> CatalogueColors { get; set; } = null!;
        public DbSet<CatalogueImage> CatalogueImages { get; set; } = null!;
        public DbSet<Accessorie> Accessories { get; set; } = null!;

        // Plans
        public DbSet<RentalPlan> RentalPlans { get; set; } = null!;
        public DbSet<RentalPlanDetail> RentalPlanDetails { get; set; } = null!;
        public DbSet<RentalPlanDetailRegion> RentalPlanDetailRegions { get; set; } = null!;
        public DbSet<OwnershipPlan> OwnershipPlans { get; set; } = null!;
        public DbSet<OwnershipPlanRegion> OwnershipPlanRegions { get; set; } = null!;
        public DbSet<OwnershipPlanFeature> OwnershipPlanFeatures { get; set; } = null!;
        public DbSet<PriceModel> PriceModels { get; set; } = null!;
        public DbSet<BikeConditionPercent> BikeConditionPercents { get; set; } = null!;
        public DbSet<OdometerPercent> OdometerPercents { get; set; } = null!;
        public DbSet<BatteryLifePercent> BatteryLifePercents { get; set; } = null!;
        public DbSet<ActivePlan> ActivePlans { get; set; } = null!;
        public DbSet<Station> Stations { get; set; } = null!;

        public DbSet<Booking> Bookings { get; set; } = null!;
        public DbSet<BookingControl> BookingControls { get; set; } = null!;
        public DbSet<BookingHistory> BookingHistories { get; set; } = null!;
        public DbSet<BookingAccessorie> BookingAccessories { get; set; } = null!;
        public DbSet<OwnershipFulfilment> OwnershipFulfilments { get; set; } = null!;
        public DbSet<Vendor> Vendors { get; set; } = null!;
        public DbSet<VendorProcurement> VendorProcurements { get; set; } = null!;

        // Documents
        public DbSet<Document> Documents { get; set; } = null!;
        public DbSet<DocumentTemplate> DocumentTemplates { get; set; } = null!;
        public DbSet<DocumentTemplateMappingParameter> DocumentTemplateMappingParameters { get; set; } = null!;
        public DbSet<CustomerKYC> CustomerKycs { get; set; } = null!;
        public DbSet<CustomerDL> CustomerDls { get; set; } = null!;

        // Customer Wallet
        public DbSet<CustomerWallet> CustomerWallets { get; set; } = null!;
        public DbSet<WalletTransaction> WalletTransactions { get; set; } = null!;

        // GPRS
        public DbSet<GprsTerminalCurrent> GprsTerminalCurrents { get; set; } = null!;
        public DbSet<GprsTerminalHistory> GprsTerminalHistories { get; set; } = null!;
        public DbSet<GprsHeartbeatCurrent> GprsHeartbeatCurrents { get; set; } = null!;
        public DbSet<GprsHeartbeatHistory> GprsHeartbeatHistories { get; set; } = null!;
        public DbSet<GprsLocationCurrent> GprsLocationCurrents { get; set; } = null!;
        public DbSet<GprsLocationHistory> GprsLocationHistories { get; set; } = null!;

        // Notifications
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<NotificationTemplate> NotificationTemplates { get; set; } = null!;
        public DbSet<WhatsAppWebhookEvent> WhatsAppWebhookEvents { get; set; } = null!;
        public DbSet<NotificationType> NotificationTypes { get; set; } = null!;
        public DbSet<NotificationConfiguration> NotificationConfigurations { get; set; } = null!;

        // Customer Devices (FCM)
        public DbSet<CustomerDevice> CustomerDevices { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
          



            // Review
            modelBuilder.Entity<Review>()
                .HasKey(r => r.Id);
            modelBuilder.Entity<Review>()
                .HasIndex(r => r.Id)
                .IsUnique();

            // Region
            modelBuilder.Entity<Region>(r =>
            {
                r.HasKey(x => x.Id);
                r.HasIndex(x => x.Id).IsUnique();
                r.HasIndex(x => x.Code).IsUnique();

                r.Property(x => x.Code).IsRequired().HasMaxLength(20);
                r.Property(x => x.Name).IsRequired().HasMaxLength(100);
                r.Property(x => x.City).IsRequired().HasMaxLength(100);
                r.Property(x => x.State).HasMaxLength(100);
                r.Property(x => x.Country).HasMaxLength(100);
                r.Property(x => x.CurrencyCode).IsRequired().HasMaxLength(10);
                r.Property(x => x.TimeZone).HasMaxLength(100);
                r.Property(x => x.DefaultLanguageCode).HasMaxLength(10);
                r.Property(x => x.IsActive).IsRequired();
                r.Property(x => x.CreatedAt).IsRequired();
            });


            // Customer
            modelBuilder.Entity<Customer>()
                .HasKey(c => c.Id);
            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.Id)
                .IsUnique();
            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.RegionId);
            modelBuilder.Entity<Customer>()
                .Property(c => c.PreferredLanguageCode)
                .HasMaxLength(2)
                .IsRequired()
                .HasDefaultValue("en");

            modelBuilder.Entity<Customer>()
                .HasOne(c => c.Region)
                .WithMany()
                .HasForeignKey(c => c.RegionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Customer>()
                .HasOne(c => c.CustomerKYC)
                .WithOne(k => k.Customer)
                .HasForeignKey<CustomerKYC>(k => k.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Customer>()
                .HasOne(c => c.CustomerDL)
                .WithOne(dl => dl.Customer)
                .HasForeignKey<CustomerDL>(dl => dl.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerKYC>()
                .HasKey(k => k.Id);
            modelBuilder.Entity<CustomerKYC>()
                .HasIndex(k => k.CustomerId)
                .IsUnique();
            modelBuilder.Entity<CustomerKYC>()
                .Property(k => k.AadharNumber)
                .HasMaxLength(20)
                .IsRequired();
            modelBuilder.Entity<CustomerKYC>()
                .HasOne(k => k.AadharFrontDocument)
                .WithMany()
                .HasForeignKey(k => k.AadharFrontDocumentId)
                .OnDelete(DeleteBehavior.ClientSetNull);
            modelBuilder.Entity<CustomerKYC>()
                .HasOne(k => k.AadharBackDocument)
                .WithMany()
                .HasForeignKey(k => k.AadharBackDocumentId)
                .OnDelete(DeleteBehavior.ClientSetNull);
            modelBuilder.Entity<CustomerKYC>()
                .HasOne(k => k.Document)
                .WithMany()
                .HasForeignKey(k => k.DocumentId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            modelBuilder.Entity<CustomerDL>()
                .HasKey(dl => dl.Id);
            modelBuilder.Entity<CustomerDL>()
                .HasIndex(dl => dl.CustomerId)
                .IsUnique();
            modelBuilder.Entity<CustomerDL>()
                .Property(dl => dl.DrivingLicenceNumber)
                .HasMaxLength(50);
            modelBuilder.Entity<CustomerDL>()
                .HasOne(dl => dl.DrivingLicenceFrontDocument)
                .WithMany()
                .HasForeignKey(dl => dl.DrivingLicenceFrontDocumentId)
                .OnDelete(DeleteBehavior.ClientSetNull);
            modelBuilder.Entity<CustomerDL>()
                .HasOne(dl => dl.DrivingLicenceBackDocument)
                .WithMany()
                .HasForeignKey(dl => dl.DrivingLicenceBackDocumentId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            // Document (Customer, Vehicle, Booking related)
            modelBuilder.Entity<Document>(d =>
            {
                d.HasKey(x => x.Id);
                d.HasIndex(x => x.CustomerId).HasFilter("[CustomerId] IS NOT NULL");
                d.HasIndex(x => x.VehicleId).HasFilter("[VehicleId] IS NOT NULL");
                d.HasIndex(x => x.BookingId).HasFilter("[BookingId] IS NOT NULL");

                // NO ACTION for Customer to avoid multiple cascade paths (Booking → Document and Customer → Document)
                d.HasOne(x => x.Customer)
                    .WithMany(c => c.Documents)
                    .HasForeignKey(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.NoAction);

                // Cascade delete for Vehicle
                d.HasOne(x => x.Vehicle)
                    .WithMany(v => v.Documents)
                    .HasForeignKey(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Cascade delete for Booking
                d.HasOne(x => x.Booking)
                    .WithMany(b => b.Documents)
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Configure properties
                d.Property(x => x.DocumentType).IsRequired();
                d.Property(x => x.FileFormat).IsRequired();
                d.Property(x => x.Name).IsRequired().HasMaxLength(200);
                d.Property(x => x.Description).HasMaxLength(500);
                d.Property(x => x.FilePath).IsRequired().HasMaxLength(1000);
                d.Property(x => x.OriginalFileName).HasMaxLength(255);
                d.Property(x => x.IsActive).IsRequired();
            });

            // CustomerDevice (FCM Push Notifications)
            modelBuilder.Entity<CustomerDevice>(cd =>
            {
                cd.HasKey(x => x.Id);

                // Unique constraint on Firebase Installation ID
                cd.HasIndex(x => x.FirebaseInstallationId)
                  .IsUnique();

                // Index for querying active devices per customer
                cd.HasIndex(x => new { x.CustomerId, x.IsActive });

                // Properties
                cd.Property(x => x.FirebaseInstallationId)
                  .IsRequired()
                  .HasMaxLength(256);

                cd.Property(x => x.FcmToken)
                  .IsRequired()
                  .HasMaxLength(4096);

                cd.Property(x => x.Platform)
                  .IsRequired()
                  .HasMaxLength(20);

                cd.Property(x => x.AppVersion)
                  .HasMaxLength(50);

                // Relationship: Customer 1 -> N CustomerDevice
                cd.HasOne(x => x.Customer)
                  .WithMany(c => c.Devices)
                  .HasForeignKey(x => x.CustomerId)
                  .OnDelete(DeleteBehavior.Cascade);
            });

            // PaymentOrder (RazorPay)
            modelBuilder.Entity<PaymentOrder>(po =>
            {
                po.HasKey(x => x.Id);
                po.HasIndex(x => x.Id).IsUnique();

                po.Property(x => x.RazorPayOrderId).IsRequired();
                po.Property(x => x.Status).IsRequired();
                po.Property(x => x.ResponseJson);
                po.Property(x => x.CreatedAt).IsRequired();
                po.Property(x => x.Amount).HasColumnType("decimal(18,2)");

                po.HasOne(x => x.Customer)
                    .WithMany()
                    .HasForeignKey(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });







            // Payment (Billing)
            modelBuilder.Entity<Payment>()
                .HasKey(p => p.Id);
            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.Id)
                .IsUnique();

            // User
            modelBuilder.Entity<User>(u =>
            {
                u.HasKey(x => x.Id);
                u.HasIndex(x => x.Id).IsUnique();

                // Firebase UID should be unique and indexed for fast lookups
                u.HasIndex(x => x.UID).IsUnique();

                // Email should be unique and indexed
                u.HasIndex(x => x.Email).IsUnique();

                // Username should be nullable but indexed for fast lookups
                u.HasIndex(x => x.Username);

                // Configure column lengths for better database performance
                u.Property(x => x.Email).HasMaxLength(256).IsRequired();
                u.Property(x => x.UID).HasMaxLength(128); // Firebase UIDs are typically 28 characters
                u.Property(x => x.Username).HasMaxLength(100);
                u.Property(x => x.Password).HasMaxLength(256); // Legacy field, may be empty for Firebase users
                u.Property(x => x.Name).HasMaxLength(200).IsRequired();
                u.Property(x => x.Phone).HasMaxLength(20);
                u.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Subscription (Billing)
            modelBuilder.Entity<Subscription>()
                .HasKey(s => s.Id);
            modelBuilder.Entity<Subscription>()
                .HasIndex(s => s.Id)
                .IsUnique();

            // CustomerBilling
            modelBuilder.Entity<CustomerBilling>(cb =>
            {
                cb.HasKey(x => x.Id);
                cb.HasIndex(x => x.Id).IsUnique();

                cb.HasOne(x => x.Customer)
                    .WithOne(c => c.CustomerBilling)
                    .HasForeignKey<CustomerBilling>(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Invoice (Billing)
            modelBuilder.Entity<Invoice>(i =>
            {
                i.HasKey(x => x.Id);
                i.HasIndex(x => x.Id).IsUnique();

                i.HasOne(x => x.Booking)
                    .WithMany()
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                i.HasMany(x => x.Payments)
                    .WithOne(p => p.Invoice)
                    .HasForeignKey(p => p.InvoiceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Payment
            modelBuilder.Entity<Payment>(p =>
            {
                p.HasKey(x => x.Id);
                p.HasIndex(x => x.Id).IsUnique();

                p.Property(x => x.PaymentGatewayReference).HasMaxLength(200).IsRequired(false);
                p.Property(x => x.FailureReason).HasMaxLength(500).IsRequired(false);

                p.HasOne(x => x.Customer)
                    .WithMany(c => c.Payments)
                    .HasForeignKey(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);

                p.HasOne(x => x.Booking)
                    .WithMany(b => b.Payments)
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                p.HasOne(x => x.Invoice)
                    .WithMany(i => i.Payments)
                    .HasForeignKey(x => x.InvoiceId)
                    .OnDelete(DeleteBehavior.ClientNoAction);

                p.HasOne(x => x.LinkedPayment)
                    .WithMany()
                    .HasForeignKey(x => x.LinkedPaymentId)
                    .OnDelete(DeleteBehavior.ClientNoAction);
            });

            // Subscription
            modelBuilder.Entity<Subscription>(s =>
            {
                s.HasKey(x => x.Id);
                s.HasIndex(x => x.Id).IsUnique();

                s.HasOne(x => x.CustomerBilling)
                    .WithOne(cb => cb.Subscription)
                    .HasForeignKey<Subscription>(x => x.CustomerBillingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Charge
            modelBuilder.Entity<Charge>(c =>
            {
                c.HasKey(x => x.Id);

                c.Property(x => x.Amount).HasColumnType("decimal(18,2)");

                c.HasOne(x => x.Customer)
                    .WithMany()
                    .HasForeignKey(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Arrears
            modelBuilder.Entity<Arrears>(a =>
            {
                a.HasKey(x => x.Id);
                a.HasIndex(x => x.Id).IsUnique();
                a.HasIndex(x => x.TransactionId).IsUnique();
                a.HasIndex(x => new { x.CustomerId, x.Status });
                a.HasIndex(x => x.BookingId);

                a.Property(x => x.TransactionId).IsRequired().HasMaxLength(100);
                a.Property(x => x.Amount).IsRequired().HasColumnType("decimal(18,2)");
                a.Property(x => x.PaidAmount).HasColumnType("decimal(18,2)");
                a.Property(x => x.BaseAmount).HasColumnType("decimal(18,2)");
                a.Property(x => x.ReferenceData).HasMaxLength(2000);
                a.Property(x => x.Reason).HasMaxLength(1000);
                a.Property(x => x.WaiverReason).HasMaxLength(500);
                a.Property(x => x.Remarks).HasMaxLength(1000);

                a.HasOne(x => x.Customer)
                    .WithMany(c => c.Arrears)
                    .HasForeignKey(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);

                a.HasOne(x => x.Booking)
                    .WithMany(b => b.Arrears)
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.ClientNoAction);
            });

            // Station
            modelBuilder.Entity<Station>(s =>
            {
                s.HasKey(x => x.Id);
                s.HasIndex(x => x.Id).IsUnique();
                s.HasIndex(x => x.RegionId);
                s.Property(x => x.Name).IsRequired().HasMaxLength(200);
                s.Property(x => x.Address).IsRequired().HasMaxLength(500);
                s.Property(x => x.PhoneNumber).IsRequired().HasMaxLength(20);
                s.Property(x => x.ImageUrl).HasMaxLength(500);
                s.Property(x => x.Latitude).HasColumnType("decimal(10,7)");
                s.Property(x => x.Longitude).HasColumnType("decimal(10,7)");

                s.HasOne(x => x.Region)
                    .WithMany()
                    .HasForeignKey(x => x.RegionId)
                    .OnDelete(DeleteBehavior.Restrict);

                s.HasMany(x => x.Vehicles)
                    .WithOne(v => v.Station)
                    .HasForeignKey(v => v.StationId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // StationInventory removed - Vehicle now has direct StationId FK

            // CustomerWallet
            modelBuilder.Entity<CustomerWallet>(w =>
            {
                w.HasKey(x => x.Id);
                w.HasIndex(x => x.CustomerId).IsUnique();
                w.Property(x => x.Balance).HasColumnType("decimal(18,2)").IsRequired();
                w.Property(x => x.PendingWithdrawalAmount).HasColumnType("decimal(18,2)").IsRequired();
                w.Property(x => x.IsActive).IsRequired();
                w.Property(x => x.CreatedAt).IsRequired();
                w.Property(x => x.UpdatedAt).IsRequired();
                w.Property(x => x.RowVersion).IsRowVersion();

                w.HasOne(x => x.Customer)
                    .WithOne(c => c.Wallet)
                    .HasForeignKey<CustomerWallet>(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);

                w.HasMany(x => x.Transactions)
                    .WithOne(t => t.Wallet)
                    .HasForeignKey(t => t.WalletId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // WalletTransaction
            modelBuilder.Entity<WalletTransaction>(wt =>
            {
                wt.HasKey(x => x.Id);
                wt.HasIndex(x => x.WalletId);
                wt.HasIndex(x => x.BookingId).HasFilter("[BookingId] IS NOT NULL");
                wt.HasIndex(x => x.PaymentId).HasFilter("[PaymentId] IS NOT NULL");
                wt.HasIndex(x => x.ReferenceNo).HasFilter("[ReferenceNo] IS NOT NULL");
                wt.HasIndex(x => x.PaymentGatewayTransactionId).HasFilter("[PaymentGatewayTransactionId] IS NOT NULL");
                wt.HasIndex(x => new { x.Status, x.CreatedAt });
                wt.HasIndex(x => new { x.TransactionType, x.Status });

                wt.Property(x => x.TransactionType).IsRequired();
                wt.Property(x => x.EntryType).IsRequired();
                wt.Property(x => x.Status).IsRequired();
                wt.Property(x => x.Amount).HasColumnType("decimal(18,2)").IsRequired();
                wt.Property(x => x.BalanceBefore).HasColumnType("decimal(18,2)");
                wt.Property(x => x.BalanceAfter).HasColumnType("decimal(18,2)");
                wt.Property(x => x.ReferenceNo).HasMaxLength(100);
                wt.Property(x => x.PaymentGatewayTransactionId).HasMaxLength(200);
                wt.Property(x => x.CorrelationId).HasMaxLength(100);
                wt.Property(x => x.Remarks).HasMaxLength(500);
                wt.Property(x => x.CreatedAt).IsRequired();

                wt.HasOne(x => x.Wallet)
                    .WithMany(w => w.Transactions)
                    .HasForeignKey(x => x.WalletId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // GPRS current terminal status
            modelBuilder.Entity<GprsTerminalCurrent>(current =>
            {
                current.HasKey(x => x.Id);
                current.HasIndex(x => x.TerminalId).IsUnique();
                current.HasIndex(x => x.VehicleId).IsUnique().HasFilter("[VehicleId] IS NOT NULL");
                current.Property(x => x.TerminalId).IsRequired().HasMaxLength(50);
                current.Property(x => x.LastImei).HasMaxLength(100);
                current.Property(x => x.LastInfoType).IsRequired().HasMaxLength(20);
                current.Property(x => x.LastSummary).HasMaxLength(4000);
                current.Property(x => x.LastRawHex).HasMaxLength(4000);
                current.Property(x => x.LastLatitude).HasColumnType("decimal(10,7)");
                current.Property(x => x.LastLongitude).HasColumnType("decimal(10,7)");

                current.HasOne(x => x.Vehicle)
                    .WithOne(s => s.GprsTerminalCurrent)
                    .HasForeignKey<GprsTerminalCurrent>(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // GPRS packet history
            modelBuilder.Entity<GprsTerminalHistory>(history =>
            {
                history.HasKey(x => x.Id);
                history.HasIndex(x => x.TerminalId);
                history.HasIndex(x => x.ReceivedAtUtc);
                history.Property(x => x.TerminalId).IsRequired().HasMaxLength(50);
                history.Property(x => x.Imei).HasMaxLength(100);
                history.Property(x => x.InfoType).IsRequired().HasMaxLength(20);
                history.Property(x => x.Summary).HasMaxLength(4000);
                history.Property(x => x.RawHex).HasMaxLength(4000);

                history.HasOne(x => x.GprsTerminalCurrent)
                    .WithMany(x => x.History)
                    .HasForeignKey(x => x.GprsTerminalCurrentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // GPRS heartbeat current
            modelBuilder.Entity<GprsHeartbeatCurrent>(current =>
            {
                current.HasKey(x => x.Id);
                current.HasIndex(x => x.TerminalId).IsUnique();
                current.HasIndex(x => x.VehicleId).IsUnique().HasFilter("[VehicleId] IS NOT NULL");
                current.Property(x => x.GpsTrackingStatus).HasMaxLength(50);
                current.Property(x => x.AlarmStatus).HasMaxLength(100);
                current.Property(x => x.ChargeStatus).HasMaxLength(50);
                current.Property(x => x.AccStatus).HasMaxLength(50);
                current.Property(x => x.DeviceStatus).HasMaxLength(50);
                current.Property(x => x.VoltageLevel).HasMaxLength(50);
                current.Property(x => x.GsmSignalLevel).HasMaxLength(50);
                current.Property(x => x.AlarmLanguage).HasMaxLength(100);
                current.Property(x => x.RawHex).HasMaxLength(4000);

                current.HasOne(x => x.Vehicle)
                    .WithOne(s => s.GprsHeartbeatCurrent)
                    .HasForeignKey<GprsHeartbeatCurrent>(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // GPRS heartbeat history
            modelBuilder.Entity<GprsHeartbeatHistory>(history =>
            {
                history.HasKey(x => x.Id);
                history.HasIndex(x => x.TerminalId);
                history.HasIndex(x => x.ReceivedAtUtc);
                history.Property(x => x.TerminalId).IsRequired().HasMaxLength(50);
                history.Property(x => x.Imei).HasMaxLength(100);
                history.Property(x => x.OilElectricityStatus).HasMaxLength(100);
                history.Property(x => x.GpsTrackingStatus).HasMaxLength(50);
                history.Property(x => x.AlarmStatus).HasMaxLength(100);
                history.Property(x => x.ChargeStatus).HasMaxLength(50);
                history.Property(x => x.AccStatus).HasMaxLength(50);
                history.Property(x => x.DeviceStatus).HasMaxLength(50);
                history.Property(x => x.VoltageLevel).HasMaxLength(50);
                history.Property(x => x.GsmSignalLevel).HasMaxLength(50);
                history.Property(x => x.AlarmLanguage).HasMaxLength(100);
                history.Property(x => x.RawHex).HasMaxLength(4000);

                history.HasOne(x => x.GprsHeartbeatCurrent)
                    .WithMany(x => x.History)
                    .HasForeignKey(x => x.GprsHeartbeatCurrentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // GPRS location current
            modelBuilder.Entity<GprsLocationCurrent>(current =>
            {
                current.HasKey(x => x.Id);
                current.HasIndex(x => x.TerminalId).IsUnique();
                current.HasIndex(x => x.VehicleId).IsUnique().HasFilter("[VehicleId] IS NOT NULL");
                current.Property(x => x.TerminalId).IsRequired().HasMaxLength(50);
                current.Property(x => x.Imei).HasMaxLength(100);
                current.Property(x => x.Latitude).HasColumnType("decimal(10,7)");
                current.Property(x => x.Longitude).HasColumnType("decimal(10,7)");
                current.Property(x => x.RawHex).HasMaxLength(4000);

                current.HasOne(x => x.Vehicle)
                    .WithOne(s => s.GprsLocationCurrent)
                    .HasForeignKey<GprsLocationCurrent>(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // GPRS location history
            modelBuilder.Entity<GprsLocationHistory>(history =>
            {
                history.HasKey(x => x.Id);
                history.HasIndex(x => x.TerminalId);
                history.HasIndex(x => x.ReceivedAtUtc);
                history.Property(x => x.TerminalId).IsRequired().HasMaxLength(50);
                history.Property(x => x.Imei).HasMaxLength(100);
                history.Property(x => x.Latitude).HasColumnType("decimal(10,7)");
                history.Property(x => x.Longitude).HasColumnType("decimal(10,7)");
                history.Property(x => x.RawHex).HasMaxLength(4000);

                history.HasOne(x => x.GprsLocationCurrent)
                    .WithMany(x => x.History)
                    .HasForeignKey(x => x.GprsLocationCurrentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // VehicleModel
            modelBuilder.Entity<VehicleModel>(st =>
            {
                st.HasKey(x => x.Id);
                st.Property(x => x.Name).IsRequired().HasMaxLength(100);
                st.Property(x => x.Description).HasMaxLength(500);
                st.Property(x => x.ImageUrl).HasMaxLength(500);
                st.Property(x => x.VideoUrl).HasMaxLength(500);
                st.Property(x => x.TopSpeed).HasMaxLength(50);
                st.Property(x => x.Range).HasMaxLength(50);
                st.Property(x => x.RentalPriceStarts).HasColumnType("decimal(18,2)");
                st.Property(x => x.OwnershipPriceStarts).HasColumnType("decimal(18,2)");

                st.HasMany(x => x.VehicleTypeRentalPlans)
                    .WithOne(x => x.VehicleModel)
                    .HasForeignKey(x => x.VehicleModelId)
                    .OnDelete(DeleteBehavior.Cascade);

                st.HasMany(x => x.VehicleTypeOwnershipPlans)
                    .WithOne(x => x.VehicleModel)
                    .HasForeignKey(x => x.VehicleModelId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // VehicleTypeRentalPlan
            modelBuilder.Entity<VehicleTypeRentalPlan>(strp =>
            {
                strp.HasKey(x => x.Id);
                strp.HasIndex(x => new { x.VehicleModelId, x.RentalPlanId }).IsUnique();

                strp.HasOne(x => x.VehicleModel)
                    .WithMany(st => st.VehicleTypeRentalPlans)
                    .HasForeignKey(x => x.VehicleModelId)
                    .OnDelete(DeleteBehavior.Cascade);

                strp.HasOne(x => x.RentalPlan)
                    .WithMany()
                    .HasForeignKey(x => x.RentalPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // VehicleTypeOwnershipPlan
            modelBuilder.Entity<VehicleTypeOwnershipPlan>(stop =>
            {
                stop.HasKey(x => x.Id);
                stop.HasIndex(x => new { x.VehicleModelId, x.OwnershipPlanId }).IsUnique();

                stop.HasOne(x => x.VehicleModel)
                    .WithMany(st => st.VehicleTypeOwnershipPlans)
                    .HasForeignKey(x => x.VehicleModelId)
                    .OnDelete(DeleteBehavior.Cascade);

                stop.HasOne(x => x.OwnershipPlan)
                    .WithMany()
                    .HasForeignKey(x => x.OwnershipPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // VehicleCatalogue
            modelBuilder.Entity<VehicleCatalogue>(vc =>
            {
                vc.HasKey(x => x.Id);
                vc.Property(x => x.Summary).HasMaxLength(250);
                vc.Property(x => x.Description).HasMaxLength(2000);
                vc.Property(x => x.Brand).IsRequired().HasMaxLength(120);
                vc.Property(x => x.Model).IsRequired().HasMaxLength(120);
                vc.Property(x => x.EngineType).HasMaxLength(100);
                vc.Property(x => x.Transmission).HasMaxLength(100);
                vc.Property(x => x.MotorType).HasMaxLength(100);
                vc.Property(x => x.BatteryType).HasMaxLength(100);
                vc.Property(x => x.BrakeType).HasMaxLength(100);
                vc.Property(x => x.SuspensionFront).HasMaxLength(200);
                vc.Property(x => x.SuspensionRear).HasMaxLength(200);
                vc.Property(x => x.Price).HasColumnType("decimal(18,2)");
                vc.Property(x => x.ExShowroomPrice).HasColumnType("decimal(18,2)");
                vc.Property(x => x.BatteryCapacityKWh).HasColumnType("decimal(8,2)");
                vc.Property(x => x.ChargingTimeHours).HasColumnType("decimal(8,2)");
                vc.Property(x => x.WeightKg).HasColumnType("decimal(10,2)");
                vc.Property(x => x.SeatHeightMm).HasColumnType("decimal(10,2)");
                vc.Property(x => x.WheelBaseMm).HasColumnType("decimal(10,2)");
                vc.Property(x => x.Features)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => string.IsNullOrWhiteSpace(v)
                            ? new List<string>()
                            : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>())
                    .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<string>>(
                        (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                        c => c.ToList()));

                vc.HasIndex(x => new { x.Brand, x.Model, x.Year });
                vc.HasIndex(x => x.VehicleModelId);

                vc.HasOne(x => x.VehicleModel)
                    .WithMany(x => x.VehicleCatalogues)
                    .HasForeignKey(x => x.VehicleModelId)
                    .OnDelete(DeleteBehavior.SetNull);

                vc.HasMany(x => x.CatalogueColors)
                    .WithOne(x => x.Catalogue)
                    .HasForeignKey(x => x.CatalogueId)
                    .OnDelete(DeleteBehavior.Cascade);

                vc.HasMany(x => x.CatalogueVendors)
                    .WithOne(x => x.Catalogue)
                    .HasForeignKey(x => x.CatalogueId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CatalogueVendor>(cv =>
            {
                cv.HasKey(x => x.Id);
                cv.HasIndex(x => new { x.CatalogueId, x.VendorId }).IsUnique();
                cv.HasIndex(x => x.CatalogueId);
                cv.HasIndex(x => x.VendorId);
                cv.HasIndex(x => new { x.CatalogueId, x.IsActive, x.Priority, x.VendorId });
                cv.Property(x => x.VendorCatalogueCode).HasMaxLength(100);
                cv.Property(x => x.VendorModelCode).HasMaxLength(100);
                cv.Property(x => x.PurchasePrice).HasColumnType("decimal(18,2)");
                cv.Property(x => x.Notes).HasMaxLength(2000);

                cv.HasOne(x => x.Catalogue)
                    .WithMany(x => x.CatalogueVendors)
                    .HasForeignKey(x => x.CatalogueId)
                    .OnDelete(DeleteBehavior.Restrict);

                cv.HasOne(x => x.Vendor)
                    .WithMany(x => x.CatalogueVendors)
                    .HasForeignKey(x => x.VendorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CatalogueColor>(cc =>
            {
                cc.HasKey(x => x.Id);
                cc.Property(x => x.ColorName).IsRequired().HasMaxLength(120);
                cc.Property(x => x.ColorCode).HasMaxLength(20);
                cc.HasIndex(x => x.CatalogueId);
                cc.HasIndex(x => new { x.CatalogueId, x.ColorName }).IsUnique();
            });

            modelBuilder.Entity<CatalogueImage>(ci =>
            {
                ci.HasKey(x => x.Id);
                ci.Property(x => x.FileName).IsRequired().HasMaxLength(255);
                ci.Property(x => x.FilePath).IsRequired().HasMaxLength(1000);
                ci.Property(x => x.MediaType).HasMaxLength(100);
                ci.HasIndex(x => x.CatalogueColorId);
                ci.HasIndex(x => new { x.CatalogueColorId, x.DisplayOrder });
                ci.HasIndex(x => new { x.CatalogueColorId, x.IsPrimary })
                    .HasFilter("[IsPrimary] = 1")
                    .IsUnique();

                ci.HasOne(x => x.CatalogueColor)
                    .WithMany(x => x.CatalogueImages)
                    .HasForeignKey(x => x.CatalogueColorId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // PriceModel
            modelBuilder.Entity<PriceModel>(pm =>
            {
                pm.HasKey(x => x.Id);
                pm.Property(x => x.Name).IsRequired().HasMaxLength(100);
                pm.Property(x => x.InsurancePercent).HasColumnType("decimal(18,2)");
                pm.Property(x => x.MaintainencePercent).HasColumnType("decimal(18,2)");
                pm.Property(x => x.ServiceChargesPercent).HasColumnType("decimal(18,2)");
                pm.Property(x => x.PriceMultiplier).HasColumnType("decimal(18,2)");
            });

            // BikeConditionPercent
            modelBuilder.Entity<BikeConditionPercent>(bc =>
            {
                bc.HasKey(x => x.Id);
                bc.Property(x => x.Name).IsRequired().HasMaxLength(100);
                bc.Property(x => x.BikeConditionPercentValue).HasColumnType("decimal(18,2)");

                bc.HasData(
                    new BikeConditionPercent { Id = 1, Name = "New", BikeConditionPercentValue = 0, IsActive = true },
                    new BikeConditionPercent { Id = 2, Name = "Excellent", BikeConditionPercentValue = 10, IsActive = true },
                    new BikeConditionPercent { Id = 3, Name = "Good", BikeConditionPercentValue = 20, IsActive = true },
                    new BikeConditionPercent { Id = 4, Name = "Fair", BikeConditionPercentValue = 30, IsActive = true },
                    new BikeConditionPercent { Id = 5, Name = "Poor", BikeConditionPercentValue = 40, IsActive = true },
                    new BikeConditionPercent { Id = 6, Name = "Broken", BikeConditionPercentValue = 50, IsActive = true }
                );
            });

            // OdometerPercent
            modelBuilder.Entity<OdometerPercent>(op =>
            {
                op.HasKey(x => x.Id);
                op.Property(x => x.Name).IsRequired().HasMaxLength(100);
                op.Property(x => x.OdometerPercentValue).HasColumnType("decimal(18,2)");

                op.HasData(
                    new OdometerPercent { Id = 1, Name = "0-1000", MinKilometers = 0, MaxKilometers = 1000, OdometerPercentValue = 0, IsActive = true },
                    new OdometerPercent { Id = 2, Name = "1000-5000", MinKilometers = 1000, MaxKilometers = 5000, OdometerPercentValue = 10, IsActive = true },
                    new OdometerPercent { Id = 3, Name = "5000-10000", MinKilometers = 5000, MaxKilometers = 10000, OdometerPercentValue = 20, IsActive = true },
                    new OdometerPercent { Id = 4, Name = "10000+", MinKilometers = 10000, MaxKilometers = null, OdometerPercentValue = 30, IsActive = true }
                );
            });

            // BatteryLifePercent
            modelBuilder.Entity<BatteryLifePercent>(bp =>
            {
                bp.HasKey(x => x.Id);
                bp.Property(x => x.Name).IsRequired().HasMaxLength(100);
                bp.Property(x => x.BatteryLifePercentValue).HasColumnType("decimal(18,2)");

                bp.HasData(
                    new BatteryLifePercent { Id = 1, Name = "0-1 Year", MinYears = 0, MaxYears = 1, BatteryLifePercentValue = 10, IsActive = true },
                    new BatteryLifePercent { Id = 2, Name = "1-2 Years", MinYears = 1, MaxYears = 2, BatteryLifePercentValue = 20, IsActive = true },
                    new BatteryLifePercent { Id = 3, Name = "2+ Years", MinYears = 2, MaxYears = null, BatteryLifePercentValue = 30, IsActive = true }
                );
            });

            // Vehicle
            modelBuilder.Entity<Vehicle>(s =>
            {
                s.HasKey(x => x.Id);
                s.HasIndex(x => x.UID).IsUnique();
                s.HasIndex(x => x.RegionId);
                s.Property(x => x.Name).IsRequired().HasMaxLength(200);
                s.Property(x => x.Manufacturer).HasMaxLength(200);
                s.Property(x => x.Range).HasMaxLength(50);
                s.Property(x => x.ImageUrl).HasMaxLength(500);
                s.Property(x => x.VideoUrl).HasMaxLength(500);
                s.Property(x => x.WarrantyPeriod).HasMaxLength(100);
                s.Property(x => x.CostPrice).HasColumnType("decimal(18,2)");
                s.Property(x => x.Price).HasColumnType("decimal(18,2)");
                s.Property(x => x.AccruedEarnings).HasColumnType("decimal(18,2)");
                s.Property(x => x.LastLatitude).HasColumnType("decimal(10,7)");
                s.Property(x => x.LastLongitude).HasColumnType("decimal(10,7)");

                s.HasOne(x => x.BikeConditionPercent)
                    .WithMany()
                    .HasForeignKey(x => x.BikeConditionPercentId)
                    .OnDelete(DeleteBehavior.SetNull);

                s.HasOne(x => x.VehicleModel)
                    .WithMany(st => st.Vehicles)
                    .HasForeignKey(x => x.VehicleModelId)
                    .OnDelete(DeleteBehavior.Restrict);

                s.HasOne(x => x.VehicleCatalogue)
                    .WithMany(vc => vc.Vehicles)
                    .HasForeignKey(x => x.VehicleCatalogueId)
                    .OnDelete(DeleteBehavior.SetNull);

                s.HasOne(x => x.CatalogueColor)
                    .WithMany()
                    .HasForeignKey(x => x.CatalogueColorId)
                    .OnDelete(DeleteBehavior.Restrict);

                s.HasOne(x => x.Region)
                    .WithMany()
                    .HasForeignKey(x => x.RegionId)
                    .OnDelete(DeleteBehavior.Restrict);

                s.HasMany(x => x.Features)
                    .WithOne(f => f.Vehicle)
                    .HasForeignKey(f => f.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Accessorie>(a =>
            {
                a.HasKey(x => x.Id);
                a.Property(x => x.Name).IsRequired().HasMaxLength(200);
                a.Property(x => x.Description).HasMaxLength(1000);
                a.Property(x => x.SalePrice).HasColumnType("decimal(18,2)");
                a.Property(x => x.RentalPricePerDay).HasColumnType("decimal(18,2)");
                a.HasIndex(x => x.Name);
            });

            // TrackerDevice
            modelBuilder.Entity<TrackerDevice>(td =>
            {
                td.HasKey(x => x.Id);
                td.Property(x => x.IMEI).IsRequired().HasMaxLength(100);
                td.Property(x => x.PhoneNumber).IsRequired().HasMaxLength(30);
                td.Property(x => x.BrandName).HasMaxLength(100);
                td.Property(x => x.ModelNumber).HasMaxLength(100);
                td.Property(x => x.Label).HasMaxLength(100);
                td.Property(x => x.PlanExpiryDate)
                    .HasDefaultValueSql("DATEADD(year, 1, GETUTCDATE())");
                td.HasIndex(x => x.IMEI).IsUnique();
                td.HasIndex(x => x.PhoneNumber).IsUnique();
                td.HasIndex(x => x.RegionId).HasFilter("[RegionId] IS NOT NULL");
                td.HasIndex(x => x.VehicleId).IsUnique().HasFilter("[VehicleId] IS NOT NULL");

                td.HasOne(x => x.Region)
                    .WithMany()
                    .HasForeignKey(x => x.RegionId)
                    .OnDelete(DeleteBehavior.Restrict);

                td.HasOne(x => x.Vehicle)
                    .WithOne(s => s.TrackerDevice)
                    .HasForeignKey<TrackerDevice>(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // VehicleFeature
            modelBuilder.Entity<VehicleFeature>(sf =>
            {
                sf.HasKey(x => x.Id);
                sf.Property(x => x.FeatureName).IsRequired().HasMaxLength(200);

                sf.HasOne(x => x.Vehicle)
                    .WithMany(s => s.Features)
                    .HasForeignKey(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // RentalPlan
            modelBuilder.Entity<RentalPlan>(rp =>
            {
                rp.HasKey(x => x.Id);
                rp.Property(x => x.Name).IsRequired().HasMaxLength(100);
                rp.Property(x => x.Duration).IsRequired().HasMaxLength(100);
                rp.Property(x => x.Badge).HasMaxLength(200);
                rp.Property(x => x.Icon).HasMaxLength(50);
                rp.Property(x => x.Description).HasMaxLength(500);
                rp.Property(x => x.ColorCode).HasMaxLength(20);
                rp.Property(x => x.DiscountPercentage).HasColumnType("decimal(5,2)");

                rp.HasMany(x => x.PlanDetails)
                    .WithOne(d => d.RentalPlan)
                    .HasForeignKey(d => d.RentalPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // RentalPlanDetail
            modelBuilder.Entity<RentalPlanDetail>(rpd =>
            {
                rpd.HasKey(x => x.Id);
                rpd.Property(x => x.KmLimit).IsRequired().HasMaxLength(100);
                rpd.Property(x => x.PriceMultiplier).HasColumnType("decimal(18,2)");
                rpd.Property(x => x.ExtraKmCharge).HasColumnType("decimal(18,2)");

                rpd.HasOne(x => x.RentalPlan)
                    .WithMany(p => p.PlanDetails)
                    .HasForeignKey(x => x.RentalPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                rpd.HasMany(x => x.RegionConfigurations)
                    .WithOne(rc => rc.RentalPlanDetail)
                    .HasForeignKey(rc => rc.RentalPlanDetailId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // RentalPlanDetailRegion
            modelBuilder.Entity<RentalPlanDetailRegion>(rpdr =>
            {
                rpdr.HasKey(x => x.Id);
                rpdr.Property(x => x.PriceMultiplier).HasColumnType("decimal(18,2)");
                rpdr.Property(x => x.ExtraKmCharge).HasColumnType("decimal(18,2)");

                rpdr.HasIndex(x => new { x.RentalPlanDetailId, x.RegionId }).IsUnique();
                rpdr.HasIndex(x => x.RegionId);

                rpdr.HasOne(x => x.Region)
                    .WithMany()
                    .HasForeignKey(x => x.RegionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // OwnershipPlan
            modelBuilder.Entity<OwnershipPlan>(op =>
            {
                op.HasKey(x => x.Id);
                op.Property(x => x.Tenure).IsRequired().HasMaxLength(100);
                op.Property(x => x.Frequency).IsRequired().HasMaxLength(50);
                op.Property(x => x.Badge).HasMaxLength(100);

                op.HasOne(x => x.VehicleCatalogue)
                    .WithMany(v => v.OwnershipPlans)
                    .HasForeignKey(x => x.VehicleCatalogueId)
                    .OnDelete(DeleteBehavior.SetNull);

                op.HasOne(x => x.PriceModel)
                    .WithOne()
                    .HasForeignKey<OwnershipPlan>(x => x.PriceModelId)
                    .OnDelete(DeleteBehavior.SetNull);

                op.HasMany(x => x.Features)
                    .WithOne(f => f.OwnershipPlan)
                    .HasForeignKey(f => f.OwnershipPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                op.HasMany(x => x.RegionConfigurations)
                    .WithOne(r => r.OwnershipPlan)
                    .HasForeignKey(r => r.OwnershipPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // OwnershipPlanRegion
            modelBuilder.Entity<OwnershipPlanRegion>(opr =>
            {
                opr.HasKey(x => x.Id);
                opr.Property(x => x.InsurancePercent).HasColumnType("decimal(18,2)");
                opr.Property(x => x.MaintainencePercent).HasColumnType("decimal(18,2)");
                opr.Property(x => x.ServiceChargesPercent).HasColumnType("decimal(18,2)");
                opr.Property(x => x.PriceMultiplier).HasColumnType("decimal(18,2)");

                opr.HasIndex(x => new { x.OwnershipPlanId, x.RegionId }).IsUnique();
                opr.HasIndex(x => x.RegionId);

                opr.HasOne(x => x.Region)
                    .WithMany()
                    .HasForeignKey(x => x.RegionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // OwnershipPlanFeature
            modelBuilder.Entity<OwnershipPlanFeature>(opf =>
            {
                opf.HasKey(x => x.Id);
                opf.Property(x => x.FeatureDescription).IsRequired().HasMaxLength(200);

                opf.HasOne(x => x.OwnershipPlan)
                    .WithMany(p => p.Features)
                    .HasForeignKey(x => x.OwnershipPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ActivePlan
            modelBuilder.Entity<ActivePlan>(ap =>
            {
                ap.HasKey(x => x.Id);
                ap.Property(x => x.PlanName).IsRequired().HasMaxLength(200);
                ap.Property(x => x.ScooterName).IsRequired().HasMaxLength(200);
                ap.Property(x => x.ScooterImageUrl).HasMaxLength(500);
                ap.Property(x => x.PaymentFrequency).IsRequired().HasMaxLength(50);
                ap.Property(x => x.PaymentAmount).HasColumnType("decimal(18,2)");
                ap.Property(x => x.Status).IsRequired().HasMaxLength(50);

                ap.HasOne(x => x.Customer)
                    .WithOne(c => c.ActivePlan)
                    .HasForeignKey<ActivePlan>(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                ap.HasOne(x => x.Booking)
                    .WithMany()
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Unified Booking ──────────────────────────────────────────────
            modelBuilder.Entity<BookingControl>(bc =>
            {
                bc.HasKey(x => x.Id);
                bc.Property(x => x.Name).IsRequired().HasMaxLength(200);
                bc.Property(x => x.IsActive).HasDefaultValue(false);
                bc.Property(x => x.LastUpdatedAt).IsRequired();
                bc.HasIndex(x => new { x.VehicleCategory, x.BookingType }).IsUnique();
            });

            modelBuilder.Entity<Booking>(b =>
            {
                b.HasKey(x => x.Id);

                b.Property(x => x.PaymentFrequency).HasMaxLength(50);
                b.Property(x => x.CancellationReason).HasMaxLength(500).IsRequired(false);
                b.Property(x => x.VehicleCategory).HasDefaultValue(VehicleCategory.TwoWheeler);

                b.Property(x => x.TotalPrice).HasColumnType("decimal(18,2)");
                b.Property(x => x.TotalPriceWithGST).HasColumnType("decimal(18,2)");
                b.Property(x => x.GSTAmount).HasColumnType("decimal(18,2)");
                b.Property(x => x.PricePerDay).HasColumnType("decimal(18,2)");
                b.Property(x => x.ExtraKMAccrued).HasColumnType("decimal(18,2)");
                b.Property(x => x.ArrearsAmount).HasColumnType("decimal(18,2)");
                b.Property(x => x.BikePrice).HasColumnType("decimal(18,2)");
                b.Property(x => x.MaintenanceCost).HasColumnType("decimal(18,2)");
                b.Property(x => x.InsuranceCost).HasColumnType("decimal(18,2)");
                b.Property(x => x.ServiceCharges).HasColumnType("decimal(18,2)");
                b.Property(x => x.BookingFee).HasColumnType("decimal(18,2)");
                b.Property(x => x.LastPaymentAmount).HasColumnType("decimal(18,2)");
                b.Property(x => x.RepaymentAmount).HasColumnType("decimal(18,2)");
                b.Property(x => x.NextPaymentAmount).HasColumnType("decimal(18,2)");

                b.HasIndex(x => x.RegionId);
                b.HasIndex(x => x.VehicleCategory);
                b.HasIndex(x => x.CatalogueId);
                b.HasIndex(x => x.CatalogueColorId);

                b.HasOne(x => x.Customer)
                    .WithMany(c => c.Bookings)
                    .HasForeignKey(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.Station)
                    .WithMany()
                    .HasForeignKey(x => x.StationId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.Region)
                    .WithMany()
                    .HasForeignKey(x => x.RegionId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.Vehicle)
                    .WithMany()
                    .HasForeignKey(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.VehicleModel)
                    .WithMany()
                    .HasForeignKey(x => x.VehicleModelId)
                    .OnDelete(DeleteBehavior.SetNull);

                b.HasOne(x => x.AlternateVehicle)
                    .WithMany()
                    .HasForeignKey(x => x.AlternateVehicleId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.VehicleCatalogue)
                    .WithMany(v => v.Bookings)
                    .HasForeignKey(x => x.VehicleCatalogueId)
                    .OnDelete(DeleteBehavior.SetNull);

                b.HasOne(x => x.Catalogue)
                    .WithMany()
                    .HasForeignKey(x => x.CatalogueId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.CatalogueColor)
                    .WithMany()
                    .HasForeignKey(x => x.CatalogueColorId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.RentalPlan)
                    .WithMany()
                    .HasForeignKey(x => x.RentalPlanId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.RentalPlanDetail)
                    .WithMany()
                    .HasForeignKey(x => x.RentalPlanDetailId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(x => x.OwnershipPlan)
                    .WithMany()
                    .HasForeignKey(x => x.OwnershipPlanId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasMany(x => x.BookingAccessories)
                    .WithOne(x => x.Booking)
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(x => x.OwnershipFulfilment)
                    .WithOne(x => x.Booking)
                    .HasForeignKey<OwnershipFulfilment>(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<OwnershipFulfilment>(of =>
            {
                of.HasKey(x => x.Id);
                of.HasIndex(x => x.BookingId).IsUnique();
                of.HasIndex(x => x.CatalogueId);
                of.HasIndex(x => x.CatalogueColorId);
                of.HasIndex(x => x.VehicleId).IsUnique().HasFilter("[VehicleId] IS NOT NULL");

                of.Property(x => x.Notes).HasMaxLength(2000);

                of.HasOne(x => x.Catalogue)
                    .WithMany()
                    .HasForeignKey(x => x.CatalogueId)
                    .OnDelete(DeleteBehavior.Restrict);

                of.HasOne(x => x.CatalogueColor)
                    .WithMany()
                    .HasForeignKey(x => x.CatalogueColorId)
                    .OnDelete(DeleteBehavior.Restrict);

                of.HasOne(x => x.Vehicle)
                    .WithMany()
                    .HasForeignKey(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.SetNull);

                of.HasMany(x => x.VendorProcurements)
                    .WithOne(x => x.OwnershipFulfilment)
                    .HasForeignKey(x => x.OwnershipFulfilmentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Vendor>(v =>
            {
                v.HasKey(x => x.Id);
                v.Property(x => x.Name).IsRequired().HasMaxLength(200);
                v.Property(x => x.ContactPerson).HasMaxLength(200);
                v.Property(x => x.PhoneNumber).HasMaxLength(30);
                v.Property(x => x.Email).HasMaxLength(200);
                v.Property(x => x.Address).HasMaxLength(500);
                v.HasMany(x => x.CatalogueVendors)
                    .WithOne(x => x.Vendor)
                    .HasForeignKey(x => x.VendorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<VendorProcurement>(vp =>
            {
                vp.HasKey(x => x.Id);
                vp.HasIndex(x => x.OwnershipFulfilmentId);
                vp.HasIndex(x => x.VendorId);
                vp.Property(x => x.VendorOrderNumber).HasMaxLength(100);
                vp.Property(x => x.Notes).HasMaxLength(2000);
                vp.Property(x => x.VendorCost).HasColumnType("decimal(18,2)");

                vp.HasOne(x => x.Vendor)
                    .WithMany(v => v.VendorProcurements)
                    .HasForeignKey(x => x.VendorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<BookingAccessorie>(ba =>
            {
                ba.HasKey(x => x.Id);

                ba.HasOne(x => x.Booking)
                    .WithMany(x => x.BookingAccessories)
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                ba.HasOne(x => x.Accessorie)
                    .WithMany(x => x.BookingAccessories)
                    .HasForeignKey(x => x.AccessorieId)
                    .OnDelete(DeleteBehavior.Restrict);

                ba.HasIndex(x => new { x.BookingId, x.AccessorieId }).IsUnique();
            });

            // ── Booking History ──────────────────────────────────────────────
            modelBuilder.Entity<BookingHistory>(bh =>
            {
                bh.HasKey(x => x.Id);
                bh.Property(x => x.ChangeReason).HasMaxLength(50);

                bh.HasOne(x => x.PreviousBooking)
                    .WithMany()
                    .HasForeignKey(x => x.PreviousBookingId)
                    .OnDelete(DeleteBehavior.Restrict);

                bh.HasOne(x => x.NewBooking)
                    .WithMany(x => x.History)
                    .HasForeignKey(x => x.NewBookingId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── DocumentTemplate ───────────────────────────────────────────────
            modelBuilder.Entity<DocumentTemplate>(dt =>
            {
                dt.HasKey(x => x.Id);
                dt.HasIndex(x => x.TemplateCode).IsUnique();
                dt.Property(x => x.DisplayName).IsRequired().HasMaxLength(200);
                dt.Property(x => x.Description).HasMaxLength(1000);
                dt.Property(x => x.TemplateCode).IsRequired().HasMaxLength(100);
                dt.Property(x => x.Subject).HasMaxLength(500);
                dt.Property(x => x.Active).IsRequired();

                dt.HasMany(x => x.MappingParameters)
                    .WithOne(x => x.DocumentTemplate)
                    .HasForeignKey(x => x.DocumentTemplateId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ── DocumentTemplateMappingParameter ──────────────────────────────
            modelBuilder.Entity<DocumentTemplateMappingParameter>(mp =>
            {
                mp.HasKey(x => x.Id);
                mp.Property(x => x.ParameterName).IsRequired().HasMaxLength(50);
                mp.Property(x => x.PlaceHolder).IsRequired().HasMaxLength(200);
                mp.Property(x => x.Description).HasMaxLength(500);
            });

            // ── NotificationType ────────────────────────────────────────────────
            modelBuilder.Entity<NotificationType>(nt =>
            {
                nt.HasKey(x => x.Id);
                nt.HasIndex(x => x.Code).IsUnique();
                nt.Property(x => x.Code).IsRequired().HasMaxLength(100);
                nt.Property(x => x.Name).IsRequired().HasMaxLength(200);
                nt.Property(x => x.Description).HasMaxLength(1000);
                nt.Property(x => x.IsActive).IsRequired();
                nt.Property(x => x.CreatedBy).HasMaxLength(100);
                nt.Property(x => x.UpdatedBy).HasMaxLength(100);
            });

            // ── NotificationConfiguration ───────────────────────────────────────
            modelBuilder.Entity<NotificationConfiguration>(nc =>
            {
                nc.HasKey(x => x.Id);
                nc.Property(x => x.TemplateCode).IsRequired().HasMaxLength(100);
                nc.Property(x => x.Name).IsRequired().HasMaxLength(200);
                nc.Property(x => x.CreatedBy).HasMaxLength(100);
                nc.Property(x => x.UpdatedBy).HasMaxLength(100);

                nc.HasOne(x => x.NotificationTypeEntity)
                    .WithMany()
                    .HasForeignKey(x => x.NotificationTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                nc.HasOne(x => x.NotificationTemplate)
                    .WithMany()
                    .HasForeignKey(x => x.NotificationTemplateId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── NotificationTemplate ────────────────────────────────────────────
            modelBuilder.Entity<NotificationTemplate>(nt =>
            {
                nt.HasKey(x => x.Id);
                nt.Property(x => x.TemplateCode).IsRequired().HasMaxLength(100);
                nt.Property(x => x.Name).IsRequired().HasMaxLength(200);
                nt.Property(x => x.Subject).HasMaxLength(500);
                nt.Property(x => x.LanguageCode).HasMaxLength(10);
                nt.Property(x => x.Description).HasMaxLength(1000);

                nt.HasOne(x => x.NotificationTypeEntity)
                    .WithMany()
                    .HasForeignKey(x => x.NotificationTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                });

            // ── Notification ────────────────────────────────────────────────────
            modelBuilder.Entity<Notification>(n =>
            {
                n.HasKey(x => x.Id);
                n.Property(x => x.Recipient).IsRequired().HasMaxLength(200);
                n.Property(x => x.Subject).HasMaxLength(500);
                n.Property(x => x.ExternalMessageId).HasMaxLength(200);
                n.Property(x => x.ErrorMessage).HasMaxLength(1000);
                n.Property(x => x.AdminUserId).HasMaxLength(100);

                n.HasOne(x => x.NotificationTypeEntity)
                    .WithMany()
                    .HasForeignKey(x => x.NotificationTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                n.HasOne(x => x.NotificationTemplate)
                    .WithMany()
                    .HasForeignKey(x => x.NotificationTemplateId)
                    .OnDelete(DeleteBehavior.Cascade);

                n.HasOne(x => x.Customer)
                    .WithMany()
                    .HasForeignKey(x => x.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            base.OnModelCreating(modelBuilder);
        }

        // Replace the method implementation for ExecuteRawSql with the following:

        public int ExecuteRawSql(string sql, params object[] parameter)
        {
            // Ensure you have: using Microsoft.EntityFrameworkCore;
            return this.Database.ExecuteSqlRaw(sql, parameter);
        }
    }
}
