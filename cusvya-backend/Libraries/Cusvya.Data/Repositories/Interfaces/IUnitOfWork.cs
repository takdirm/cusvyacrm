using System;
using System.Threading.Tasks;
using Scootr.Core.Domain.Customers;
using Scootr.Core.Domain.Documents;
using Scootr.Core.Domain.Plans;
using Scootr.Core.Domain.Stations;
using Scootr.Core.Domain.Users;
using Scootr.Core.Domain.Vehicles;
using Scootr.Core.Domain.Vendors;
using Scootr.Core.Domain.Billings;
using Scootr.Core.Domain.Billing;
using Scootr.Core.Domain.Gprs;
using Scootr.Core.Domain.Regions;

namespace Scootr.Data.Repositories.Interfaces
{
    /// <summary>
    /// Unit of Work pattern to manage transactions across multiple repositories
    /// </summary>
    public interface IUnitOfWork : IDisposable
    {
        // Customer related repositories
        IRepository<Customer> Customers { get; }
        IRepository<CustomerKYC> CustomerKycs { get; }
        IRepository<CustomerDL> CustomerDls { get; }
        IRepository<CustomerWallet> CustomerWallets { get; }
        IRepository<WalletTransaction> WalletTransactions { get; }
        IRepository<CustomerDevice> CustomerDevices { get; }
        IRepository<Region> Regions { get; }

        // Document repository
        IRepository<Document> Documents { get; }
        IRepository<DocumentTemplate> DocumentTemplates { get; }
        IRepository<DocumentTemplateMappingParameter> DocumentTemplateMappingParameters { get; }

        // Station related repositories
        IRepository<Station> Stations { get; }
       
      

        // User repository
        IRepository<User> Users { get; }

        // Booking related repositories
      
        // Billing related repositories
        IRepository<CustomerBilling> CustomerBillings { get; }
        IRepository<Invoice> Invoices { get; }
        IRepository<Payment> Payments { get; }
        IRepository<Subscription> Subscriptions { get; }
        IRepository<Charge> Charges { get; }
        IRepository<PaymentOrder> PaymentOrders { get; }
        IRepository<Core.Domain.Billing.Arrears> Arrears { get; }

      

      
        // Settings repository
        IRepository<Scootr.Core.Domain.Settings.Setting> Settings { get; }

        // Vehicle repositories
        IRepository<Vehicle> Vehicles { get; }
        IRepository<TrackerDevice> TrackerDevices { get; }
        IRepository<VehicleModel> VehicleModels { get; }
        IRepository<VehicleFeature> VehicleFeatures { get; }
        IRepository<VehicleTypeRentalPlan> VehicleTypeRentalPlans { get; }
        IRepository<VehicleTypeOwnershipPlan> VehicleTypeOwnershipPlans { get; }
        IRepository<VehicleCatalogue> VehicleCatalogues { get; }
        IRepository<CatalogueVendor> CatalogueVendors { get; }
        IRepository<CatalogueColor> CatalogueColors { get; }
        IRepository<CatalogueImage> CatalogueImages { get; }
        IRepository<Accessorie> Accessories { get; }

        // Plan repositories
        IRepository<RentalPlan> RentalPlans { get; }
        IRepository<RentalPlanDetail> RentalPlanDetails { get; }
        IRepository<RentalPlanDetailRegion> RentalPlanDetailRegions { get; }
        IRepository<OwnershipPlan> OwnershipPlans { get; }
        IRepository<OwnershipPlanRegion> OwnershipPlanRegions { get; }
        IRepository<OwnershipPlanFeature> OwnershipPlanFeatures { get; }
        IRepository<PriceModel> PriceModels { get; }
        IRepository<BikeConditionPercent> BikeConditionPercents { get; }
        IRepository<OdometerPercent> OdometerPercents { get; }
        IRepository<BatteryLifePercent> BatteryLifePercents { get; }
        IRepository<ActivePlan> ActivePlans { get; }

        // Unified Booking repositories
        IRepository<BookingControl> BookingControls { get; }
        IRepository<Booking> Bookings { get; }
        IRepository<BookingHistory> BookingHistories { get; }
        IRepository<BookingAccessorie> BookingAccessories { get; }
        IRepository<OwnershipFulfilment> OwnershipFulfilments { get; }

        // Vendor repositories
        IRepository<Vendor> Vendors { get; }
        IRepository<VendorProcurement> VendorProcurements { get; }

        // GPRS repositories
        IRepository<GprsTerminalCurrent> GprsTerminalCurrents { get; }
        IRepository<GprsTerminalHistory> GprsTerminalHistories { get; }
        IRepository<GprsHeartbeatCurrent> GprsHeartbeatCurrents { get; }
        IRepository<GprsHeartbeatHistory> GprsHeartbeatHistories { get; }
        IRepository<GprsLocationCurrent> GprsLocationCurrents { get; }
        IRepository<GprsLocationHistory> GprsLocationHistories { get; }

        // Transaction management
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
        Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation);
        Task ExecuteInTransactionAsync(Func<Task> operation);
    }
}
