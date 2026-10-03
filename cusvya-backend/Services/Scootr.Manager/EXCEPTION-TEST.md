# Exception Handling Test

To test that the service handles exceptions correctly and doesn't shutdown:

1. Modify the `DoWorkAsync` method in `ScootrWorker.cs` to throw an exception on a specific execution:

```csharp
private async Task DoWorkAsync(CancellationToken cancellationToken)
{
	try
	{
		_executionCount++;

		// Test exception handling
		if (_executionCount == 3)
		{
			throw new Exception("Test exception - intentional error for testing");
		}

		var message = $"Hello Scootr - Execution #{_executionCount} at: {DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss}";
		_logger.LogInformation(message);
		Console.WriteLine(message);

		await Task.CompletedTask;
	}
	catch (Exception ex)
	{
		// IMPORTANT: Catch exceptions here to prevent service shutdown
		_failureCount++;
		_logger.LogError(ex, "ERROR in DoWorkAsync (Execution #{ExecutionCount}, Failure #{FailureCount}): {ErrorMessage}",
			_executionCount, _failureCount, ex.Message);
		Console.WriteLine($"ERROR in DoWorkAsync: {ex.Message}");

		// Service continues running even after exception
	}
}
```

2. Run the service with `dotnet run`
3. The service should:
   - Execute successfully: Execution #1
   - Execute successfully: Execution #2
   - Throw exception on: Execution #3 (but continue running)
   - Execute successfully: Execution #4
   - Continue running normally

This proves the service is resilient and won't crash on exceptions.
