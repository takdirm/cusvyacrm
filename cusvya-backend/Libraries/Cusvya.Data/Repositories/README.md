# Repository Pattern Implementation

This document provides comprehensive guidance on using the Repository Pattern and Unit of Work implementation in the Blush application.

## Overview

The Repository Pattern provides an abstraction layer between the data access layer and the business logic layer, offering:

- **Separation of Concerns**: Business logic is separated from data access logic
- **Testability**: Easy to mock repositories for unit testing
- **Maintainability**: Centralized data access logic
- **Flexibility**: Easy to switch data sources
- **Transaction Management**: Coordinated operations across multiple entities

## Architecture

### Components

1. **IRepository<T>**: Generic interface for all CRUD operations
2. **Repository<T>**: Generic implementation of IRepository<T>
3. **IUnitOfWork**: Interface for managing transactions across repositories
4. **UnitOfWork**: Implementation of IUnitOfWork

## Setup

### 1. Register Services

In your `Program.cs` or `Startup.cs`:

```csharp
using Blush.Data.Extensions;

// Add repository pattern services
builder.Services.AddRepositoryPattern();
```

### 2. Inject Dependencies

Inject `IUnitOfWork` or `IRepository<T>` into your services:

```csharp
public class ProductService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }
}
```

## Usage Examples

### Basic CRUD Operations

#### Create
```csharp
var product = new Product { Name = "Lipstick", Price = 25.99m };
await _unitOfWork.Products.AddAsync(product);
await _unitOfWork.SaveChangesAsync();
```

#### Read
```csharp
// Get by ID
var product = await _unitOfWork.Products.GetByIdAsync(1);

// Get all
var products = await _unitOfWork.Products.GetAllAsync();

// Find with predicate
var activeProducts = await _unitOfWork.Products.FindAsync(p => p.IsActive);

// First or default
var firstProduct = await _unitOfWork.Products.FirstOrDefaultAsync(p => p.Price > 20);
```

#### Update
```csharp
var product = await _unitOfWork.Products.GetByIdAsync(1);
product.Price = 29.99m;
await _unitOfWork.Products.UpdateAsync(product);
await _unitOfWork.SaveChangesAsync();
```

#### Delete
```csharp
// Delete by ID
await _unitOfWork.Products.DeleteAsync(1);
await _unitOfWork.SaveChangesAsync();

// Delete entity
var product = await _unitOfWork.Products.GetByIdAsync(1);
await _unitOfWork.Products.DeleteAsync(product);
await _unitOfWork.SaveChangesAsync();

// Delete range
await _unitOfWork.Products.DeleteRangeAsync(p => p.Price < 10);
await _unitOfWork.SaveChangesAsync();
```

### Eager Loading (Include Related Entities)

```csharp
// Single include
var order = await _unitOfWork.Orders.GetByIdAsync(1, o => o.Items);

// Multiple includes
var order = await _unitOfWork.Orders.GetByIdAsync(
    1,
    o => o.Items,
    o => o.Payment,
    o => o.Customer
);

// Find with includes
var orders = await _unitOfWork.Orders.FindAsync(
    o => o.CustomerId == 123,
    o => o.Items,
    o => o.Payment
);
```

### Pagination

```csharp
var (products, totalCount) = await _unitOfWork.Products.GetPagedAsync(
    pageNumber: 1,
    pageSize: 20,
    predicate: p => p.Price > 10,
    orderBy: query => query.OrderBy(p => p.Name),
    includes: p => p.ProductCategory
);

Console.WriteLine($"Total products: {totalCount}");
Console.WriteLine($"Products on this page: {products.Count()}");
```

### Query Operations

```csharp
// Count
var totalProducts = await _unitOfWork.Products.CountAsync();
var activeProducts = await _unitOfWork.Products.CountAsync(p => p.IsActive);

// Any
var hasExpensiveProducts = await _unitOfWork.Products.AnyAsync(p => p.Price > 100);

// Advanced queries with IQueryable
var query = _unitOfWork.Products
    .QueryNoTracking()
    .Where(p => p.Price > 20)
    .OrderBy(p => p.Name)
    .Take(10);

var products = await Task.FromResult(query.ToList());
```

### Transaction Management

```csharp
try
{
    await _unitOfWork.BeginTransactionAsync();

    // Create order
    var order = new Order { CustomerId = 1, TotalAmount = 100 };
    await _unitOfWork.Orders.AddAsync(order);
    await _unitOfWork.SaveChangesAsync();

    // Add order items
    var item = new OrderItem { OrderId = order.Id, ProductId = 1, Quantity = 2 };
    await _unitOfWork.OrderItems.AddAsync(item);
    await _unitOfWork.SaveChangesAsync();

    // Update customer wallet
    var customer = await _unitOfWork.Customers.GetByIdAsync(1);
    customer.WalletBalance -= 100;
    await _unitOfWork.Customers.UpdateAsync(customer);

    await _unitOfWork.CommitTransactionAsync();
}
catch (Exception ex)
{
    await _unitOfWork.RollbackTransactionAsync();
    throw;
}
```

### Working with Multiple Repositories

```csharp
public async Task<OrderSummaryDto> GetOrderSummaryAsync(int orderId)
{
    // Get order
    var order = await _unitOfWork.Orders.GetByIdAsync(
        orderId,
        o => o.Items
    );

    if (order == null)
        throw new NotFoundException("Order not found");

    // Get customer
    var customer = await _unitOfWork.Customers.GetByIdAsync(order.CustomerId);

    // Get products for order items
    var productIds = order.Items.Select(i => i.ProductId).ToList();
    var products = await _unitOfWork.Products.FindAsync(
        p => productIds.Contains(p.Id)
    );

    return new OrderSummaryDto
    {
        Order = order,
        Customer = customer,
        Products = products
    };
}
```

## Best Practices

### 1. Always Save Changes

Remember to call `SaveChangesAsync()` after repository operations:

```csharp
await _unitOfWork.Products.AddAsync(product);
await _unitOfWork.SaveChangesAsync(); // ? Don't forget this!
```

### 2. Use Transactions for Multiple Operations

When performing multiple related operations, use transactions:

```csharp
await _unitOfWork.BeginTransactionAsync();
try
{
    // Multiple operations
    await _unitOfWork.CommitTransactionAsync();
}
catch
{
    await _unitOfWork.RollbackTransactionAsync();
    throw;
}
```

### 3. Use NoTracking for Read-Only Queries

For better performance on read-only queries:

```csharp
var products = _unitOfWork.Products
    .QueryNoTracking()
    .Where(p => p.IsActive)
    .ToList();
```

### 4. Dispose UnitOfWork Properly

Use dependency injection (it handles disposal automatically) or use `using`:

```csharp
using (var unitOfWork = serviceProvider.GetService<IUnitOfWork>())
{
    // Use unit of work
} // Automatically disposed
```

### 5. Prefer Async Methods

Always use async methods for better scalability:

```csharp
// ? Good
var product = await _unitOfWork.Products.GetByIdAsync(1);

// ? Avoid
var product = _unitOfWork.Products.GetByIdAsync(1).Result;
```

## Available Repositories

The `IUnitOfWork` provides access to all entity repositories:

- `Customers`, `Addresses`, `CustomerAddresses`, `CustomerBookings`, `ShippingAddresses`, `Vanities`
- `Users`
- `Bookings`
- `CustomerBillings`, `Invoices`, `Payments`, `Subscriptions`, `Charges`, `PaymentOrders`
- `Artists`
- `Orders`, `OrderItems`
- `Carts`, `CartItems`
- `Products`, `ProductCategories`, `ProductVariants`, `Patterns`
- `Designs`, `DesignCategories`, `Models`, `ModelCategories`
- `CustomerLooks`
- `MediaVideos`
- `Reviews`
- `Promotions`
- `Settings`

## Testing

Mock the repositories for unit testing:

```csharp
[Test]
public async Task CreateOrder_ShouldAddOrder()
{
    // Arrange
    var mockUnitOfWork = new Mock<IUnitOfWork>();
    var mockOrderRepo = new Mock<IRepository<Order>>();
    
    mockUnitOfWork.Setup(u => u.Orders).Returns(mockOrderRepo.Object);
    mockOrderRepo.Setup(r => r.AddAsync(It.IsAny<Order>()))
        .ReturnsAsync((Order o) => o);
    
    var service = new OrderService(mockUnitOfWork.Object);
    var order = new Order { CustomerId = 1 };
    
    // Act
    var result = await service.CreateOrderAsync(order);
    
    // Assert
    Assert.NotNull(result);
    mockOrderRepo.Verify(r => r.AddAsync(It.IsAny<Order>()), Times.Once);
}
```

## Advanced Scenarios

### Custom Repository

If you need entity-specific operations, create a custom repository:

```csharp
public interface IProductRepository : IRepository<Product>
{
    Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId);
    Task<IEnumerable<Product>> GetFeaturedProductsAsync();
}

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId)
    {
        return await _dbSet
            .Where(p => p.ProductCategoryId == categoryId)
            .Include(p => p.ProductCategory)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetFeaturedProductsAsync()
    {
        return await _dbSet
            .Where(p => p.IsFeatured)
            .OrderByDescending(p => p.Rating)
            .Take(10)
            .ToListAsync();
    }
}
```

### Specifications Pattern (Optional Enhancement)

For complex queries, consider implementing the Specification pattern:

```csharp
public interface ISpecification<T>
{
    Expression<Func<T, bool>> Criteria { get; }
    List<Expression<Func<T, object>>> Includes { get; }
}

// Usage
var spec = new ProductByCategorySpecification(categoryId);
var products = await _unitOfWork.Products.FindAsync(spec.Criteria, spec.Includes.ToArray());
```

## Performance Tips

1. **Use pagination** for large datasets
2. **Use `AsNoTracking()`** for read-only queries
3. **Minimize includes** - only load what you need
4. **Batch operations** - use `AddRangeAsync` instead of multiple `AddAsync` calls
5. **Use async/await** throughout
6. **Consider caching** for frequently accessed data

## Troubleshooting

### Issue: Changes not saved
**Solution**: Make sure to call `SaveChangesAsync()`

### Issue: Navigation properties are null
**Solution**: Use the overload with includes parameter

### Issue: Slow queries
**Solution**: Use `QueryNoTracking()` and add appropriate indexes

### Issue: Deadlocks in transactions
**Solution**: Keep transactions short and always rollback on errors

## Support

For more examples, see: `Libraries\Blush.Data\Repositories\Examples\OrderServiceExample.cs`
