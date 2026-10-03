using Cusvya.Core.Template.Entities;

namespace Cusvya.Services.Template.Customers;

public interface ICustomerService
{
    Task<List<Customer>> ListAsync(CancellationToken cancellationToken = default);
    Task<Customer?> GetAsync(int id, CancellationToken cancellationToken = default);
    Task<Customer?> GetByFirebaseUidAsync(string firebaseUid, CancellationToken cancellationToken = default);
    Task<Customer> CreateAsync(Customer customer, CancellationToken cancellationToken = default);
    Task<Customer?> UpdateAsync(int id, Customer customer, CancellationToken cancellationToken = default);
    Task<Customer> UpsertByFirebaseUidAsync(Customer customer, CancellationToken cancellationToken = default);
}
