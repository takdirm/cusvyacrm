# Repository Pattern - Quick Reference

## Setup (One-Time)

Add to your `Program.cs` or `Startup.cs`:

```csharp
using Blush.Data.Extensions;

builder.Services.AddRepositoryPattern();
```

## Basic Usage

### Inject in Constructor

```csharp
public class YourService
{
    private readonly IUnitOfWork _unitOfWork;
    
    public YourService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }
}
```

## Common Operations

### Create
```csharp
var entity = new Product { ... };
await _unitOfWork.Products.AddAsync(entity);
await _unitOfWork.SaveChangesAsync();
```

### Read
```csharp
// By ID
var product = await _unitOfWork.Products.GetByIdAsync(1);

// All
var products = await _unitOfWork.Products.GetAllAsync();

// Find
var filtered = await _unitOfWork.Products.FindAsync(p => p.Price > 20);

// With includes (eager loading)
var order = await _unitOfWork.Orders.GetByIdAsync(1, o => o.Items, o => o.Payment);
```

### Update
```csharp
var product = await _unitOfWork.Products.GetByIdAsync(1);
product.Price = 29.99m;
await _unitOfWork.Products.UpdateAsync(product);
await _unitOfWork.SaveChangesAsync();
```

### Delete
```csharp
await _unitOfWork.Products.DeleteAsync(1);
await _unitOfWork.SaveChangesAsync();
```

## Pagination

```csharp
var (items, total) = await _unitOfWork.Products.GetPagedAsync(
    pageNumber: 1,
    pageSize: 20,
    predicate: p => p.IsActive,
    orderBy: query => query.OrderBy(p => p.Name)
);
```

## Transactions

```csharp
try
{
    await _unitOfWork.BeginTransactionAsync();
    
    // Multiple operations...
    await _unitOfWork.Orders.AddAsync(order);
    await _unitOfWork.SaveChangesAsync();
    
    await _unitOfWork.OrderItems.AddAsync(item);
    await _unitOfWork.SaveChangesAsync();
    
    await _unitOfWork.CommitTransactionAsync();
}
catch
{
    await _unitOfWork.RollbackTransactionAsync();
    throw;
}
```

## Available Repositories

Access via `_unitOfWork.{RepositoryName}`:

**Customers:** `Customers`, `Addresses`, `CustomerAddresses`, `CustomerBookings`, `ShippingAddresses`, `Vanities`

**Users:** `Users`

**Bookings:** `Bookings`

**Billing:** `CustomerBillings`, `Invoices`, `Payments`, `Subscriptions`, `Charges`, `PaymentOrders`

**Artists:** `Artists`

**Orders:** `Orders`, `OrderItems`

**Carts:** `Carts`, `CartItems`

**Products:** `Products`, `ProductCategories`, `ProductVariants`, `Patterns`

**Designs:** `Models`, `ModelCategories`

**TryOns:** `CustomerLooks`

**Social:** `MediaVideos`

**Reviews:** `Reviews`

**Promotions:** `Promotions`

**Settings:** `Settings`

## Best Practices

? **Always call `SaveChangesAsync()`** after repository operations
? **Use transactions** for multiple related operations
? **Use `QueryNoTracking()`** for read-only queries
? **Use pagination** for large datasets
? **Prefer async methods** throughout

? Avoid `.Result` or `.Wait()` - use `await` instead

## Full Documentation

See `Libraries\Blush.Data\Repositories\README.md` for detailed documentation and examples.
