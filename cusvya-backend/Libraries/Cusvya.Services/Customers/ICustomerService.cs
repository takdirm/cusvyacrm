using Scootr.Core;
using Scootr.Core.Domain.Billings;
using Scootr.Core.Domain.Customers;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Customers
{
    public interface ICustomerService
    {
        /// <summary>
        /// Registers a customer using Firebase phone verification.
        /// If a customer with the given UID already exists, returns the existing customer (idempotent).
        /// Only PhoneNumber and UID are saved on first registration.
        /// </summary>
        Task<(Customer customer, bool isNew)> RegisterAsync(string phoneNumber, string uid);

        /// <summary>
        /// Creates a new customer.
        /// </summary>
        /// <param name="customer">The customer entity to create.</param>
        /// <returns>The created customer entity.</returns>
        Task<Customer> CreateAsync(Customer customer);

        Task<Customer?> GetByUIdAsync(string uid);
        Task<List<Customer>> GetAllAsync();

        Task<PaginatedResult<Customer>> GetPagedAsync(int page, int pageSize, string? searchTerm = null, bool? isActive = null, bool? isVerified = null);


        /// <summary>
        /// Search customers by Name, Email, or Phone Number
        /// </summary>
        /// <param name="searchTerm">Search term to match against Name, Email, or Phone</param>
        /// <returns>List of customers matching the search criteria</returns>
        Task<List<Customer>> SearchCustomersAsync(string searchTerm);

        Task<bool> DeleteAsync(int id);


        Task<Customer?> GetByIdAsync(int customerId);
        /// <summary>
        /// Updates an existing customer.
        /// </summary>
        /// <param name="customer">The customer entity with updated values.</param>
        /// <returns>True if the update was successful; otherwise, false.</returns>
        Task<bool> UpdateAsync(Customer customer);

        /// <summary>
        /// Updates the KYC verification status for a customer.
        /// </summary>
        Task<bool> UpdateKycStatusAsync(int customerId, CustomerKycStatus status);

        Task<CustomerKYC?> GetCustomerKycAsync(int customerId);

        Task<CustomerKYC?> SubmitCustomerKycAsync(
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
            int? legacyDocumentId = null);

        Task<Customer?> UpdatePreferredLanguageAsync(int customerId, string preferredLanguageCode);

        Task<CustomerKYC?> ApproveCustomerKycAsync(int customerId, bool approve);
        Task<CustomerKYC?> RejectCustomerKycAsync(int customerId, string reason);

        Task<CustomerDL?> GetCustomerDlAsync(int customerId);

        Task<CustomerDL?> SubmitCustomerDlAsync(int customerId, string? drivingLicenceNumber, int? drivingLicenceFrontDocumentId, int? drivingLicenceBackDocumentId);

        Task<CustomerDL?> ApproveCustomerDlAsync(int customerId, bool approve);
        Task<CustomerDL?> RejectCustomerDlAsync(int customerId, string reason);

        // ------------------------------
        // CustomerBilling CRUD methods
        // ------------------------------

        /// <summary>
        /// Gets the active CustomerBilling for a customer.
        /// </summary>
        Task<CustomerBilling?> GetCustomerBillingAsync(int customerId);

        /// <summary>
        /// Gets a CustomerBilling by its identifier.
        /// </summary>
        Task<CustomerBilling?> GetCustomerBillingByIdAsync(int customerBillingId);

        /// <summary>
        /// Creates a CustomerBilling record.
        /// </summary>
        Task<CustomerBilling> CreateCustomerBillingAsync(CustomerBilling billing);

        /// <summary>
        /// Updates a CustomerBilling record.
        /// </summary>
        Task<bool> UpdateCustomerBillingAsync(CustomerBilling billing);

        /// <summary>
        /// Deletes a CustomerBilling record by id.
        /// </summary>
        Task<bool> DeleteCustomerBillingAsync(int customerBillingId);

    }
}
