using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Scootr.Core.Domain.Customers;
using Scootr.Core.Domain.Documents;
using Scootr.Core.Domain.Plans;
using Scootr.Core.Domain.Stations;
using Scootr.Core.Domain.Users;
using Scootr.Core.Domain.Vehicles;
using Scootr.Core.Domain.Vendors;

using Scootr.Core.Domain.Billings;
using Scootr.Core.Domain.Billing;
using Scootr.Core.Domain.Reviews;
using Scootr.Core.Domain.Gprs;
using Scootr.Core.Domain.Regions;
using Scootr.Data.Repositories.Interfaces;

namespace Scootr.Data.Repositories.Implementation
{
    /// <summary>
    /// Unit of Work implementation to manage transactions across repositories
    /// </summary>
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private IDbContextTransaction? _transaction;

        // Repository instances
        private IRepository<Customer>? _customers;
        private IRepository<CustomerKYC>? _customerKycs;
        private IRepository<CustomerDL>? _customerDls;
        private IRepository<CustomerWallet>? _customerWallets;
        private IRepository<WalletTransaction>? _walletTransactions;
        private IRepository<CustomerDevice>? _customerDevices;
        private IRepository<Region>? _regions;
        private IRepository<Station>? _stations;

        // (StationInventory removed - replaced by Vehicle.StationId FK)

        private IRepository<Document>? _documents;
        private IRepository<DocumentTemplate>? _documentTemplates;
        private IRepository<DocumentTemplateMappingParameter>? _documentTemplateMappingParameters;

        private IRepository<User>? _users;
        private IRepository<CustomerBilling>? _customerBillings;
        private IRepository<Invoice>? _invoices;
        private IRepository<Payment>? _payments;
        private IRepository<Subscription>? _subscriptions;
        private IRepository<Charge>? _charges;
        private IRepository<PaymentOrder>? _paymentOrders;
        private IRepository<Core.Domain.Billing.Arrears>? _arrears;
        
        private IRepository<Review>? _reviews;
        private IRepository<Scootr.Core.Domain.Settings.Setting>? _settings;

        // Vehicles
        private IRepository<Vehicle>? _vehicles;
        private IRepository<TrackerDevice>? _trackerDevices;
        private IRepository<VehicleModel>? _vehicleModels;
        private IRepository<VehicleFeature>? _vehicleFeatures;
        private IRepository<VehicleTypeRentalPlan>? _vehicleTypeRentalPlans;
        private IRepository<VehicleTypeOwnershipPlan>? _vehicleTypeOwnershipPlans;
        private IRepository<VehicleCatalogue>? _vehicleCatalogues;
        private IRepository<CatalogueVendor>? _catalogueVendors;
        private IRepository<CatalogueColor>? _catalogueColors;
        private IRepository<CatalogueImage>? _catalogueImages;
        private IRepository<Accessorie>? _accessories;

        // Plans
        private IRepository<RentalPlan>? _rentalPlans;
        private IRepository<RentalPlanDetail>? _rentalPlanDetails;
        private IRepository<RentalPlanDetailRegion>? _rentalPlanDetailRegions;
        private IRepository<OwnershipPlan>? _ownershipPlans;
        private IRepository<OwnershipPlanRegion>? _ownershipPlanRegions;
        private IRepository<OwnershipPlanFeature>? _ownershipPlanFeatures;
        private IRepository<PriceModel>? _priceModels;
        private IRepository<BikeConditionPercent>? _bikeConditionPercents;
        private IRepository<OdometerPercent>? _odometerPercents;
        private IRepository<BatteryLifePercent>? _batteryLifePercents;
        private IRepository<ActivePlan>? _activePlans;

        // Unified Booking
        private IRepository<BookingControl>? _bookingControls;
        private IRepository<Booking>? _bookings;
        private IRepository<BookingHistory>? _bookingHistories;
        private IRepository<BookingAccessorie>? _bookingAccessories;
        private IRepository<OwnershipFulfilment>? _ownershipFulfilments;

        // Vendors
        private IRepository<Vendor>? _vendors;
        private IRepository<VendorProcurement>? _vendorProcurements;

        // GPRS
        private IRepository<GprsTerminalCurrent>? _gprsTerminalCurrents;
        private IRepository<GprsTerminalHistory>? _gprsTerminalHistories;
        private IRepository<GprsHeartbeatCurrent>? _gprsHeartbeatCurrents;
        private IRepository<GprsHeartbeatHistory>? _gprsHeartbeatHistories;
        private IRepository<GprsLocationCurrent>? _gprsLocationCurrents;
        private IRepository<GprsLocationHistory>? _gprsLocationHistories;

        public UnitOfWork(AppDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        #region Repository Properties

        public IRepository<Customer> Customers =>
            _customers ??= new Repository<Customer>(_context);

        public IRepository<CustomerKYC> CustomerKycs =>
            _customerKycs ??= new Repository<CustomerKYC>(_context);

        public IRepository<CustomerDL> CustomerDls =>
            _customerDls ??= new Repository<CustomerDL>(_context);

        public IRepository<Document> Documents =>
            _documents ??= new Repository<Document>(_context);

        public IRepository<DocumentTemplate> DocumentTemplates =>
            _documentTemplates ??= new Repository<DocumentTemplate>(_context);

        public IRepository<DocumentTemplateMappingParameter> DocumentTemplateMappingParameters =>
            _documentTemplateMappingParameters ??= new Repository<DocumentTemplateMappingParameter>(_context);

        public IRepository<CustomerWallet> CustomerWallets =>
            _customerWallets ??= new Repository<CustomerWallet>(_context);

        public IRepository<WalletTransaction> WalletTransactions =>
            _walletTransactions ??= new Repository<WalletTransaction>(_context);

        public IRepository<CustomerDevice> CustomerDevices =>
            _customerDevices ??= new Repository<CustomerDevice>(_context);

        public IRepository<Region> Regions =>
            _regions ??= new Repository<Region>(_context);

        public IRepository<Station> Stations =>
            _stations ??= new Repository<Station>(_context);

        public IRepository<User> Users =>
            _users ??= new Repository<User>(_context);

        public IRepository<CustomerBilling> CustomerBillings => 
            _customerBillings ??= new Repository<CustomerBilling>(_context);

        public IRepository<Invoice> Invoices => 
            _invoices ??= new Repository<Invoice>(_context);

        public IRepository<Payment> Payments => 
            _payments ??= new Repository<Payment>(_context);

        public IRepository<Subscription> Subscriptions => 
            _subscriptions ??= new Repository<Subscription>(_context);

        public IRepository<Charge> Charges => 
            _charges ??= new Repository<Charge>(_context);

        public IRepository<PaymentOrder> PaymentOrders => 
            _paymentOrders ??= new Repository<PaymentOrder>(_context);

        public IRepository<Core.Domain.Billing.Arrears> Arrears =>
            _arrears ??= new Repository<Core.Domain.Billing.Arrears>(_context);




     
        public IRepository<Review> Reviews => 
            _reviews ??= new Repository<Review>(_context);

      
        public IRepository<Scootr.Core.Domain.Settings.Setting> Settings => 
            _settings ??= new Repository<Scootr.Core.Domain.Settings.Setting>(_context);

        public IRepository<Vehicle> Vehicles =>
            _vehicles ??= new Repository<Vehicle>(_context);

        public IRepository<TrackerDevice> TrackerDevices =>
            _trackerDevices ??= new Repository<TrackerDevice>(_context);

        public IRepository<VehicleModel> VehicleModels =>
            _vehicleModels ??= new Repository<VehicleModel>(_context);

        public IRepository<VehicleFeature> VehicleFeatures =>
            _vehicleFeatures ??= new Repository<VehicleFeature>(_context);

        public IRepository<VehicleTypeRentalPlan> VehicleTypeRentalPlans =>
            _vehicleTypeRentalPlans ??= new Repository<VehicleTypeRentalPlan>(_context);

        public IRepository<VehicleTypeOwnershipPlan> VehicleTypeOwnershipPlans =>
            _vehicleTypeOwnershipPlans ??= new Repository<VehicleTypeOwnershipPlan>(_context);

        public IRepository<VehicleCatalogue> VehicleCatalogues =>
            _vehicleCatalogues ??= new Repository<VehicleCatalogue>(_context);

        public IRepository<CatalogueVendor> CatalogueVendors =>
            _catalogueVendors ??= new Repository<CatalogueVendor>(_context);

        public IRepository<CatalogueColor> CatalogueColors =>
            _catalogueColors ??= new Repository<CatalogueColor>(_context);

        public IRepository<CatalogueImage> CatalogueImages =>
            _catalogueImages ??= new Repository<CatalogueImage>(_context);

        public IRepository<Accessorie> Accessories =>
            _accessories ??= new Repository<Accessorie>(_context);

        public IRepository<RentalPlan> RentalPlans =>
            _rentalPlans ??= new Repository<RentalPlan>(_context);

        public IRepository<RentalPlanDetail> RentalPlanDetails =>
            _rentalPlanDetails ??= new Repository<RentalPlanDetail>(_context);

        public IRepository<RentalPlanDetailRegion> RentalPlanDetailRegions =>
            _rentalPlanDetailRegions ??= new Repository<RentalPlanDetailRegion>(_context);

        public IRepository<OwnershipPlan> OwnershipPlans =>
            _ownershipPlans ??= new Repository<OwnershipPlan>(_context);

        public IRepository<OwnershipPlanRegion> OwnershipPlanRegions =>
            _ownershipPlanRegions ??= new Repository<OwnershipPlanRegion>(_context);

        public IRepository<OwnershipPlanFeature> OwnershipPlanFeatures =>
            _ownershipPlanFeatures ??= new Repository<OwnershipPlanFeature>(_context);

        public IRepository<PriceModel> PriceModels =>
            _priceModels ??= new Repository<PriceModel>(_context);

        public IRepository<BikeConditionPercent> BikeConditionPercents =>
            _bikeConditionPercents ??= new Repository<BikeConditionPercent>(_context);

        public IRepository<OdometerPercent> OdometerPercents =>
            _odometerPercents ??= new Repository<OdometerPercent>(_context);

        public IRepository<BatteryLifePercent> BatteryLifePercents =>
            _batteryLifePercents ??= new Repository<BatteryLifePercent>(_context);

        public IRepository<ActivePlan> ActivePlans =>
            _activePlans ??= new Repository<ActivePlan>(_context);

        public IRepository<BookingControl> BookingControls =>
            _bookingControls ??= new Repository<BookingControl>(_context);

        public IRepository<Booking> Bookings =>
            _bookings ??= new Repository<Booking>(_context);

        public IRepository<BookingHistory> BookingHistories =>
            _bookingHistories ??= new Repository<BookingHistory>(_context);

        public IRepository<BookingAccessorie> BookingAccessories =>
            _bookingAccessories ??= new Repository<BookingAccessorie>(_context);

        public IRepository<OwnershipFulfilment> OwnershipFulfilments =>
            _ownershipFulfilments ??= new Repository<OwnershipFulfilment>(_context);

        public IRepository<Vendor> Vendors =>
            _vendors ??= new Repository<Vendor>(_context);

        public IRepository<VendorProcurement> VendorProcurements =>
            _vendorProcurements ??= new Repository<VendorProcurement>(_context);

        public IRepository<GprsTerminalCurrent> GprsTerminalCurrents =>
            _gprsTerminalCurrents ??= new Repository<GprsTerminalCurrent>(_context);

        public IRepository<GprsTerminalHistory> GprsTerminalHistories =>
            _gprsTerminalHistories ??= new Repository<GprsTerminalHistory>(_context);

        public IRepository<GprsHeartbeatCurrent> GprsHeartbeatCurrents =>
            _gprsHeartbeatCurrents ??= new Repository<GprsHeartbeatCurrent>(_context);

        public IRepository<GprsHeartbeatHistory> GprsHeartbeatHistories =>
            _gprsHeartbeatHistories ??= new Repository<GprsHeartbeatHistory>(_context);

        public IRepository<GprsLocationCurrent> GprsLocationCurrents =>
            _gprsLocationCurrents ??= new Repository<GprsLocationCurrent>(_context);

        public IRepository<GprsLocationHistory> GprsLocationHistories =>
            _gprsLocationHistories ??= new Repository<GprsLocationHistory>(_context);

        #endregion

        #region Transaction Management

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            if (_transaction != null)
            {
                throw new InvalidOperationException("A transaction is already in progress.");
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            if (strategy.RetriesOnFailure)
            {
                throw new InvalidOperationException(
                    "BeginTransactionAsync is not supported when retry execution strategy is enabled. " +
                    "Use ExecuteInTransactionAsync instead.");
            }

            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            try
            {
                await SaveChangesAsync();
                
                if (_transaction != null)
                {
                    await _transaction.CommitAsync();
                }
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
            finally
            {
                if (_transaction != null)
                {
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var result = await operation();
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return result;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        public async Task ExecuteInTransactionAsync(Func<Task> operation)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    await operation();
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        #endregion

        #region Dispose

        private bool _disposed = false;

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    _transaction?.Dispose();
                    _context.Dispose();
                }
            }
            _disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion
    }
}
