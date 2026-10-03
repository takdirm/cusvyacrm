using Scootr.Core.Domain.Customers;
using Scootr.Core.Domain.Billings;
using Scootr.Core;
using Scootr.Core.Helpers;
using Scootr.Core.Domain.Billing;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Services.Regions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Customers
{
    public class CustomerService : ICustomerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRegionContext _regionContext;

        public CustomerService(IUnitOfWork unitOfWork, IRegionContext regionContext)
        {
            _unitOfWork = unitOfWork;
            _regionContext = regionContext;
        }

        public async Task<Customer?> GetByIdAsync(int id)
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id, x => x.Region, x => x.CustomerKYC!, x => x.CustomerDL!);
            if (customer == null) return null;

            return IsInScopedRegion(customer) ? customer : null;
        }

        public async Task<Customer?> GetByUIdAsync(string uid)
        {
            if (string.IsNullOrWhiteSpace(uid)) return null;
            var customer = await _unitOfWork.Customers.FirstOrDefaultAsync(x => x.UID == uid, x => x.Region, x => x.CustomerKYC!, x => x.CustomerDL!);
            if (customer == null) return null;

            return IsInScopedRegion(customer) ? customer : null;
        }

        public async Task<List<Customer>> GetAllAsync()
        {
            var customers = _regionContext.HasRegion
                ? await _unitOfWork.Customers.FindAsync(x => x.RegionId == _regionContext.RegionId!.Value, x => x.Region, x => x.CustomerKYC!, x => x.CustomerDL!)
                : await _unitOfWork.Customers.GetAllAsync(x => x.Region, x => x.CustomerKYC!, x => x.CustomerDL!);
            return customers.ToList();
        }

        public async Task<PaginatedResult<Customer>> GetPagedAsync(int page, int pageSize, string? searchTerm = null, bool? isActive = null, bool? isVerified = null)
        {
            System.Linq.Expressions.Expression<Func<Customer, bool>>? predicate = null;
            var normalizedSearchTerm = searchTerm?.Trim() ?? string.Empty;

            if (!string.IsNullOrWhiteSpace(searchTerm) || isActive.HasValue || isVerified.HasValue || _regionContext.HasRegion)
            {
                predicate = c =>
                    (!_regionContext.HasRegion || c.RegionId == _regionContext.RegionId!.Value) &&
                    (normalizedSearchTerm.Length == 0 ||
                     c.FirstName!.Contains(normalizedSearchTerm) ||
                     c.Email!.Contains(normalizedSearchTerm) ||
                     c.PhoneNumber.Contains(normalizedSearchTerm)) &&
                    (!isActive.HasValue || c.IsActive == isActive.Value) &&
                    (!isVerified.HasValue || ((c.CustomerKYC != null && c.CustomerKYC.Status == CustomerKycStatus.Approved) == isVerified.Value));
            }

            var (items, totalCount) = await _unitOfWork.Customers.GetPagedAsync(
                page,
                pageSize,
                predicate,
                query => query.OrderBy(c => c.Id),
                q => q.Region,
                q => q.CustomerKYC!,
                q => q.CustomerDL!
            );

            return new PaginatedResult<Customer>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<List<Customer>> SearchCustomersAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return new List<Customer>();

            var customers = await _unitOfWork.Customers.FindAsync(c =>
                (!_regionContext.HasRegion || c.RegionId == _regionContext.RegionId!.Value) &&
                (
                    (c.FirstName != null && c.FirstName.Contains(searchTerm)) ||
                    (c.Email != null && c.Email.Contains(searchTerm)) ||
                    c.PhoneNumber.Contains(searchTerm)
                ),
                c => c.Region,
                c => c.CustomerKYC!,
                c => c.CustomerDL!
            );

            return customers.OrderBy(c => c.FirstName).ToList();
        }

        public async Task<(Customer customer, bool isNew)> RegisterAsync(string phoneNumber, string uid)
        {
            EnsureRegionContextAvailableForCustomerWrite();

            // Idempotent: return existing customer if already registered with this UID or phone number
            var existing = await _unitOfWork.Customers.FirstOrDefaultAsync(x => 
                x.UID == uid || x.PhoneNumber == phoneNumber);

            if (existing != null)
            {
                if (existing.RegionId != _regionContext.RegionId!.Value)
                {
                    throw new InvalidOperationException("Customer is assigned to another region.");
                }

                // Update UID if customer exists with same phone but different/missing UID
                if (existing.UID != uid)
                {
                    existing.UID = uid;
                    await _unitOfWork.SaveChangesAsync();
                }
                return (existing, false);
            }

            return await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var customer = new Customer
                {
                    UID = uid,
                    PhoneNumber = phoneNumber,
                    RegionId = _regionContext.RegionId!.Value,
                    IsPhoneVerified = true,
                    IsActive = true,
                    BillingType = BillingType.Wallet,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Customers.AddAsync(customer);

                // Create a default billing account for the new customer
                var billing = new CustomerBilling
                {
                    CustomerId = customer.Id,
                    BillingCycle = BillingCycleType.Monthly,
                    BillingType = BillingType.Wallet,
                    NextBillingDate = DateTime.UtcNow.AddMonths(1),
                    IsActive = true
                };

                await _unitOfWork.CustomerBillings.AddAsync(billing);

                customer.CustomerBilling = billing;
                return (customer, true);
            });
        }

        public async Task<Customer> CreateAsync(Customer customer)
        {
            EnsureRegionContextAvailableForCustomerWrite();

            return await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                // default billing type to Wallet (prepaid)
                customer.BillingType = BillingType.Wallet;
                customer.RegionId = _regionContext.RegionId!.Value;

                // create customer
                await _unitOfWork.Customers.AddAsync(customer);

                // create default customer billing account (active) for the new customer
                var billing = new CustomerBilling
                {
                    CustomerId = customer.Id,
                    BillingCycle = BillingCycleType.Monthly,
                    BillingType = BillingType.Wallet,
                    NextBillingDate = DateTime.UtcNow.AddMonths(1),
                    IsActive = true
                };

                await _unitOfWork.CustomerBillings.AddAsync(billing);

                // attach billing to returned customer instance
                customer.CustomerBilling = billing;

                return customer;
            });
        }

        public async Task<bool> UpdateAsync(Customer customer)
        {
            var existing = await _unitOfWork.Customers.GetByIdAsync(customer.Id);
            if (existing == null) return false;
            if (!IsInScopedRegion(existing)) return false;

            // Customer home region is assigned by backend context at creation time.
            customer.RegionId = existing.RegionId;

            await _unitOfWork.Customers.UpdateAsync(customer);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateKycStatusAsync(int customerId, CustomerKycStatus status)
        {
            var customerExists = await _unitOfWork.Customers.AnyAsync(x => x.Id == customerId);
            if (!customerExists) return false;

            var kyc = await _unitOfWork.CustomerKycs.FirstOrDefaultAsync(x => x.CustomerId == customerId);
            if (kyc == null)
            {
                kyc = new CustomerKYC
                {
                    CustomerId = customerId,
                    AadharNumber = string.Empty,
                    Status = status,
                    CreatedAt = DateTime.UtcNow,
                };
                await _unitOfWork.CustomerKycs.AddAsync(kyc);
            }
            else
            {
                kyc.Status = status;
                kyc.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.CustomerKycs.UpdateAsync(kyc);
            }

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<Customer?> UpdatePreferredLanguageAsync(int customerId, string preferredLanguageCode)
        {
            var customer = await GetCustomerInScopeByIdAsync(customerId);
            if (customer == null) return null;

            var normalizedCode = (preferredLanguageCode ?? string.Empty).Trim().ToLowerInvariant();
            var supported = new HashSet<string> { "en", "hn", "kn" };
            if (!supported.Contains(normalizedCode))
                throw new InvalidOperationException("Preferred language must be one of: en, hn, kn.");

            customer.PreferredLanguageCode = normalizedCode;
            await _unitOfWork.Customers.UpdateAsync(customer);
            await _unitOfWork.SaveChangesAsync();

            return customer;
        }

        public async Task<CustomerKYC?> GetCustomerKycAsync(int customerId)
        {
            return await _unitOfWork.CustomerKycs.FirstOrDefaultAsync(
                x => x.CustomerId == customerId,
                x => x.Document!,
                x => x.AadharFrontDocument!,
                x => x.AadharBackDocument!);
        }

        public async Task<CustomerKYC?> SubmitCustomerKycAsync(
            int customerId,
            string aadharNumber,
            int? aadharFrontDocumentId,
            int? aadharBackDocumentId,
            string firstName,
            string lastName,
            string address,
            string city,
            string state,
            string zipCode,
            int? legacyDocumentId = null)
        {
            var customer = await GetCustomerInScopeByIdAsync(customerId);
            if (customer == null) return null;

            var normalizedAadhar = (aadharNumber ?? string.Empty).Replace(" ", string.Empty);
            if (string.IsNullOrWhiteSpace(normalizedAadhar) || normalizedAadhar.Length != 12 || !normalizedAadhar.All(char.IsDigit))
                throw new InvalidOperationException("Aadhar number must be a valid 12-digit value.");

            firstName = (firstName ?? string.Empty).Trim();
            lastName = (lastName ?? string.Empty).Trim();
            address = (address ?? string.Empty).Trim();
            city = (city ?? string.Empty).Trim();
            state = (state ?? string.Empty).Trim();
            zipCode = (zipCode ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(firstName) ||
                string.IsNullOrWhiteSpace(lastName) ||
                string.IsNullOrWhiteSpace(address) ||
                string.IsNullOrWhiteSpace(city) ||
                string.IsNullOrWhiteSpace(state) ||
                string.IsNullOrWhiteSpace(zipCode))
            {
                throw new InvalidOperationException("First name, last name, address, city, state, and zip code are required.");
            }

            var effectiveFrontDocumentId = aadharFrontDocumentId ?? legacyDocumentId;
            if (effectiveFrontDocumentId.HasValue)
            {
                var document = await _unitOfWork.Documents.GetByIdAsync(effectiveFrontDocumentId.Value);
                if (document == null || !document.IsActive)
                    throw new InvalidOperationException("Document not found or inactive.");
            }

            if (aadharBackDocumentId.HasValue)
            {
                var document = await _unitOfWork.Documents.GetByIdAsync(aadharBackDocumentId.Value);
                if (document == null || !document.IsActive)
                    throw new InvalidOperationException("Back document not found or inactive.");
            }

            var existing = await _unitOfWork.CustomerKycs.FirstOrDefaultAsync(x => x.CustomerId == customerId);
            if (existing != null && existing.Status == CustomerKycStatus.Approved)
                throw new InvalidOperationException("KYC is already approved and cannot be updated.");

            if (existing != null && existing.Status == CustomerKycStatus.Rejected)
            {
                existing.RejectionReason = null;
            }

            if (existing == null)
            {
                existing = new CustomerKYC
                {
                    CustomerId = customerId,
                    AadharNumber = normalizedAadhar,
                    Status = CustomerKycStatus.PendingApproval,
                    DocumentId = effectiveFrontDocumentId,
                    AadharFrontDocumentId = effectiveFrontDocumentId,
                    AadharBackDocumentId = aadharBackDocumentId,
                    CreatedAt = DateTime.UtcNow,
                };

                await _unitOfWork.CustomerKycs.AddAsync(existing);
            }
            else
            {
                existing.AadharNumber = normalizedAadhar;
                existing.DocumentId = effectiveFrontDocumentId;
                existing.AadharFrontDocumentId = effectiveFrontDocumentId;
                existing.AadharBackDocumentId = aadharBackDocumentId;
                existing.Status = CustomerKycStatus.PendingApproval;
                existing.RejectionReason = null;
                existing.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.CustomerKycs.UpdateAsync(existing);
            }

            customer.FirstName = firstName;
            customer.LastName = lastName;
            customer.Address = address;
            customer.City = city;
            customer.State = state;
            customer.ZipCode = zipCode;
            await _unitOfWork.Customers.UpdateAsync(customer);
            await _unitOfWork.SaveChangesAsync();
            return existing;
        }

        public async Task<CustomerKYC?> ApproveCustomerKycAsync(int customerId, bool approve)
        {
            var kyc = await _unitOfWork.CustomerKycs.FirstOrDefaultAsync(x => x.CustomerId == customerId);
            if (kyc == null) return null;

            if (approve)
            {
                kyc.Status = CustomerKycStatus.Approved;
            }
            else
            {
                kyc.Status = CustomerKycStatus.PendingApproval;
            }

            kyc.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CustomerKycs.UpdateAsync(kyc);

            // If KYC is approved, update associated booking status
            if (approve)
            {
                var booking = await _unitOfWork.Bookings.FirstOrDefaultAsync(
                    b => b.CustomerId == customerId &&
                         b.Status == Core.Domain.Plans.BookingStatus.KYCPending,
                    b => b.VehicleCatalogue);

                if (booking != null)
                {
                    if (booking.BookingType == Core.Domain.Plans.BookingType.Rental)
                    {
                        // Update Rental booking from KYCPending to Initiated
                        booking.Status = Core.Domain.Plans.BookingStatus.VehicleReadyForPickup;
                        booking.LastUpdatedAt = DateTime.UtcNow;
                        await _unitOfWork.Bookings.UpdateAsync(booking);
                    }
                    else if (booking.BookingType == Core.Domain.Plans.BookingType.Ownership)
                    {
                        // Process order confirmation for Ownership booking
                        var estimatedDays = booking.VehicleCatalogue?.EstimatedDelivaryDays;
                        if (estimatedDays.HasValue)
                        {
                            booking.EstimatedDelivaryDate = DateTime.UtcNow.Date.AddDays(estimatedDays.Value);
                        }

                      //  var hasTemporaryVehicle = await _unitOfWork.Vehicles.AnyAsync(v => v.IsActive && v.VehicleListingStatus == Core.Domain.Vehicles.VehicleListingStatus.Available);
                      //  booking.Status = hasTemporaryVehicle ? Core.Domain.Plans.BookingStatus.TemporaryVehicleAvailable : Core.Domain.Plans.BookingStatus.OrderConfirmed;
                        booking.Status = Core.Domain.Plans.BookingStatus.AwaitingVehicle;
                        booking.LastUpdatedAt = DateTime.UtcNow;
                        await _unitOfWork.Bookings.UpdateAsync(booking);
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync();
            return kyc;
        }

public async Task<CustomerKYC?> RejectCustomerKycAsync(int customerId, string reason)
        {
            var kyc = await _unitOfWork.CustomerKycs.FirstOrDefaultAsync(x => x.CustomerId == customerId);
            if (kyc == null) return null;

            kyc.Status = CustomerKycStatus.Rejected;
            kyc.RejectionReason = reason?.Trim();
            kyc.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CustomerKycs.UpdateAsync(kyc);
            await _unitOfWork.SaveChangesAsync();
            return kyc;
        }

        public async Task<CustomerDL?> GetCustomerDlAsync(int customerId)
        {
            return await _unitOfWork.CustomerDls.FirstOrDefaultAsync(
                x => x.CustomerId == customerId,
                x => x.DrivingLicenceFrontDocument!,
                x => x.DrivingLicenceBackDocument!);
        }

        public async Task<CustomerDL?> SubmitCustomerDlAsync(int customerId, string? drivingLicenceNumber, int? drivingLicenceFrontDocumentId, int? drivingLicenceBackDocumentId)
        {
            var customer = await GetCustomerInScopeByIdAsync(customerId);
            if (customer == null) return null;

            if (drivingLicenceFrontDocumentId.HasValue)
            {
                var document = await _unitOfWork.Documents.GetByIdAsync(drivingLicenceFrontDocumentId.Value);
                if (document == null || !document.IsActive)
                    throw new InvalidOperationException("Front document not found or inactive.");
            }

            if (drivingLicenceBackDocumentId.HasValue)
            {
                var document = await _unitOfWork.Documents.GetByIdAsync(drivingLicenceBackDocumentId.Value);
                if (document == null || !document.IsActive)
                    throw new InvalidOperationException("Back document not found or inactive.");
            }

            var existing = await _unitOfWork.CustomerDls.FirstOrDefaultAsync(x => x.CustomerId == customerId);
            if (existing != null && existing.Status == CustomerDLStatus.Approved)
                throw new InvalidOperationException("Driving licence is already approved and cannot be updated.");

            if (existing != null && existing.Status == CustomerDLStatus.Rejected)
            {
                existing.RejectionReason = null;
            }

            if (existing == null)
            {
                var normalizedDrivingLicenceNumber = drivingLicenceNumber ?? string.Empty;
                existing = new CustomerDL();
                existing.CustomerId = customerId;
                existing.DrivingLicenceNumber = normalizedDrivingLicenceNumber;
                existing.Status = CustomerDLStatus.PendingApproval;
                existing.DrivingLicenceFrontDocumentId = drivingLicenceFrontDocumentId;
                existing.DrivingLicenceBackDocumentId = drivingLicenceBackDocumentId;
                existing.CreatedAt = DateTime.UtcNow;

                await _unitOfWork.CustomerDls.AddAsync(existing);
            }
            else
            {
                existing.DrivingLicenceNumber = drivingLicenceNumber ?? string.Empty;
                existing.DrivingLicenceFrontDocumentId = drivingLicenceFrontDocumentId;
                existing.DrivingLicenceBackDocumentId = drivingLicenceBackDocumentId;
                existing.Status = CustomerDLStatus.PendingApproval;
                existing.RejectionReason = null;
                existing.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.CustomerDls.UpdateAsync(existing);
            }

            await _unitOfWork.SaveChangesAsync();
            return existing;
        }

        public async Task<CustomerDL?> ApproveCustomerDlAsync(int customerId, bool approve)
        {
            var customerDl = await _unitOfWork.CustomerDls.FirstOrDefaultAsync(x => x.CustomerId == customerId);
            if (customerDl == null) return null;
           
            customerDl.Status = approve ? CustomerDLStatus.Approved : CustomerDLStatus.PendingApproval;
            customerDl.RejectionReason = approve ? null : customerDl.RejectionReason;
            customerDl.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CustomerDls.UpdateAsync(customerDl);

            await _unitOfWork.SaveChangesAsync();
            return customerDl;
        }

        public async Task<CustomerDL?> RejectCustomerDlAsync(int customerId, string reason)
        {
            var customerDl = await _unitOfWork.CustomerDls.FirstOrDefaultAsync(x => x.CustomerId == customerId);
            if (customerDl == null) return null;

            customerDl.Status = CustomerDLStatus.Rejected;
            customerDl.RejectionReason = reason?.Trim();
            customerDl.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CustomerDls.UpdateAsync(customerDl);

            await _unitOfWork.SaveChangesAsync();
            return customerDl;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _unitOfWork.Customers.GetByIdAsync(id);
            if (existing == null) return false;
            if (!IsInScopedRegion(existing)) return false;

            var result = await _unitOfWork.Customers.DeleteAsync(id);
            if (!result) return false;

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

       

       
      

     
        
       
        // ------------------------------
        // CustomerBilling CRUD
        // ------------------------------

        public async Task<CustomerBilling?> GetCustomerBillingAsync(int customerId)
        {
            return await _unitOfWork.CustomerBillings.FirstOrDefaultAsync(
                cb => cb.CustomerId == customerId && cb.IsActive,
                cb => cb.Subscription!,
                cb => cb.Invoices,
                cb => cb.Payments
            );
        }

        public async Task<CustomerBilling?> GetCustomerBillingByIdAsync(int customerBillingId)
        {
            return await _unitOfWork.CustomerBillings.GetByIdAsync(
                customerBillingId,
                cb => cb.Subscription!,
                cb => cb.Invoices,
                cb => cb.Payments
            );
        }

        public async Task<CustomerBilling> CreateCustomerBillingAsync(CustomerBilling billing)
        {
            await _unitOfWork.CustomerBillings.AddAsync(billing);
            await _unitOfWork.SaveChangesAsync();
            return billing;
        }

        public async Task<bool> UpdateCustomerBillingAsync(CustomerBilling billing)
        {
            var existing = await _unitOfWork.CustomerBillings.GetByIdAsync(billing.Id);
            if (existing == null) return false;

            await _unitOfWork.CustomerBillings.UpdateAsync(billing);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCustomerBillingAsync(int customerBillingId)
        {
            var result = await _unitOfWork.CustomerBillings.DeleteAsync(customerBillingId);
            if (!result) return false;

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        //public async Task<double?> GetWalletBalanceAsync(int customerId)
        //{
        //    var customer = await _unitOfWork.Customers.GetByIdAsync(customerId);
        //    if (customer?.BillingType != BillingType.Wallet)

        private void EnsureRegionContextAvailableForCustomerWrite()
        {
            if (!_regionContext.HasRegion || !_regionContext.RegionId.HasValue)
                throw new InvalidOperationException("X-Region-Code header is required for customer creation and registration.");
        }

        private bool IsInScopedRegion(Customer customer)
        {
            if (!_regionContext.HasRegion || !_regionContext.RegionId.HasValue)
                return true;

            return customer.RegionId == _regionContext.RegionId.Value;
        }

        private async Task<Customer?> GetCustomerInScopeByIdAsync(int customerId)
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(customerId);
            if (customer == null) return null;

            return IsInScopedRegion(customer) ? customer : null;
        }
        //        return null;
        //    return customer?.WalletBalance;
        //}
    }
}