using Cusvya.Core.Template.Entities;
using Cusvya.Data.Template.Repositories;

namespace Cusvya.Services.Template.Customers;

public sealed class CustomerService(IUnitOfWork unitOfWork) : ICustomerService
{
    public Task<List<Customer>> ListAsync(CancellationToken cancellationToken = default)
    {
        return unitOfWork.Customers.ListAsync(cancellationToken);
    }

    public Task<Customer?> GetAsync(int id, CancellationToken cancellationToken = default)
    {
        return unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
    }

    public async Task<Customer?> GetByFirebaseUidAsync(string firebaseUid, CancellationToken cancellationToken = default)
    {
        var result = await unitOfWork.Customers.FindAsync(x => x.FirebaseUid == firebaseUid, cancellationToken);
        return result.FirstOrDefault();
    }

    public async Task<Customer> CreateAsync(Customer customer, CancellationToken cancellationToken = default)
    {
        var created = await unitOfWork.Customers.AddAsync(customer, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return created;
    }

    public async Task<Customer?> UpdateAsync(int id, Customer customer, CancellationToken cancellationToken = default)
    {
        var existing = await unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        existing.Name = customer.Name;
        existing.Email = customer.Email;
        existing.PhoneNumber = customer.PhoneNumber;
        existing.IsActive = customer.IsActive;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        unitOfWork.Customers.Update(existing);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<Customer> UpsertByFirebaseUidAsync(Customer customer, CancellationToken cancellationToken = default)
    {
        var existing = await GetByFirebaseUidAsync(customer.FirebaseUid, cancellationToken);
        if (existing is null)
        {
            return await CreateAsync(customer, cancellationToken);
        }

        existing.Name = string.IsNullOrWhiteSpace(customer.Name) ? existing.Name : customer.Name;
        existing.Email = string.IsNullOrWhiteSpace(customer.Email) ? existing.Email : customer.Email;
        existing.PhoneNumber = string.IsNullOrWhiteSpace(customer.PhoneNumber) ? existing.PhoneNumber : customer.PhoneNumber;
        existing.IsActive = customer.IsActive;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        unitOfWork.Customers.Update(existing);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return existing;
    }
}
