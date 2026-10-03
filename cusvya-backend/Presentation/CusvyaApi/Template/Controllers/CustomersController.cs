using Cusvya.Api.Template.Contracts.Customers;
using Cusvya.Core.Template.Entities;
using Cusvya.Services.Template.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cusvya.Api.Template.Controllers;

[ApiController]
[Authorize(Policy = "UserOrCustomer")]
[Route("api/customers")]
public sealed class CustomersController(ICustomerService customerService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<CustomerResponse>), StatusCodes.Status200OK)]
    public async Task<List<CustomerResponse>> List(CancellationToken cancellationToken)
    {
        var customers = await customerService.ListAsync(cancellationToken);
        return customers.Select(Map).ToList();
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var customer = await customerService.GetAsync(id, cancellationToken);
        return customer is null ? NotFound() : Ok(Map(customer));
    }

    [HttpPost]
    [Authorize(Policy = "UserOnly")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CustomerUpsertRequest request, CancellationToken cancellationToken)
    {
        var customer = await customerService.CreateAsync(new Customer
        {
            Name = request.Name,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            FirebaseUid = request.FirebaseUid,
            IsActive = request.IsActive
        }, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = customer.Id }, Map(customer));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "UserOnly")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerUpsertRequest request, CancellationToken cancellationToken)
    {
        var updated = await customerService.UpdateAsync(id, new Customer
        {
            Name = request.Name,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            FirebaseUid = request.FirebaseUid,
            IsActive = request.IsActive
        }, cancellationToken);

        return updated is null ? NotFound() : Ok(Map(updated));
    }

    private static CustomerResponse Map(Customer customer) =>
        new(
            customer.Id,
            customer.Name,
            customer.Email,
            customer.PhoneNumber,
            customer.FirebaseUid,
            customer.IsActive,
            new DateTimeOffset(DateTime.SpecifyKind(customer.CreatedAtUtc, DateTimeKind.Utc)),
            customer.UpdatedAtUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(customer.UpdatedAtUtc.Value, DateTimeKind.Utc)));
}
