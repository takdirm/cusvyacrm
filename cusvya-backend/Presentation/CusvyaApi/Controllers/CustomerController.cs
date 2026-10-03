using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Scootr.Data.Services.Customers;
using Scootr.Core.Domain.Customers;
using Scootr.Core;
using AutoMapper;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;
using Scootr.Data.Dtos.Customers;
using Scootr.Data.Services.Payments;
using Scootr.Core.Domain.Billings;
using Scootr.Data.DTOs.Billings.Payments;
using Microsoft.Extensions.Logging;
using Scootr.Data.Services.Firebase;

namespace ScootrApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;
        private readonly IPaymentService _paymentService;
        private readonly ICustomerWalletService _walletService;
        private readonly IFirebaseUserManagementService _firebaseService;
        private readonly IMapper _mapper;
        private readonly ILogger<CustomerController> _logger;

        public CustomerController(
            ICustomerService customerService, 
            IPaymentService paymentService, 
            ICustomerWalletService walletService,
            IFirebaseUserManagementService firebaseService,
            IMapper mapper,
            ILogger<CustomerController> logger)
        {
            _customerService = customerService;
            _paymentService = paymentService;
            _walletService = walletService;
            _firebaseService = firebaseService;
            _mapper = mapper;
            _logger = logger;
        }

        /// <summary>
        /// Registers a customer using Firebase phone OTP verification.
        /// If the customer already exists with the given UID, returns the existing record.
        /// Only PhoneNumber and Firebase UID are stored on first registration.
        /// This endpoint allows anonymous access since the customer doesn't exist in the system yet.
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(CustomerRegisterResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(CustomerRegisterResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<CustomerRegisterResponseDto>> Register([FromBody] CustomerRegisterDto registerDto)
        {
            _logger.LogInformation("Register called for PhoneNumber: {PhoneNumber}", registerDto?.PhoneNumber);

            if (string.IsNullOrWhiteSpace(registerDto.PhoneNumber) || string.IsNullOrWhiteSpace(registerDto.UID))
            {
                _logger.LogWarning("Register failed: Missing PhoneNumber or UID");
                return BadRequest(new { message = "PhoneNumber and UID are required." });
            }

            // Verify Firebase ID token from Authorization header
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Register failed: Missing or invalid Authorization header");
                return Unauthorized(new { message = "Firebase authentication token is required." });
            }

            var idToken = authHeader.Substring("Bearer ".Length).Trim();

            try
            {
                // Verify the Firebase ID token
                var firebaseToken = await _firebaseService.VerifyIdTokenAsync(idToken, checkRevoked: true);

                if (firebaseToken == null || firebaseToken.Uid != registerDto.UID)
                {
                    _logger.LogWarning(
                        "Register failed: Token UID mismatch. Token UID: {TokenUid}, Provided UID: {ProvidedUid}",
                        firebaseToken?.Uid,
                        registerDto.UID);
                    return Unauthorized(new { message = "Invalid or mismatched Firebase token." });
                }

                _logger.LogInformation(
                    "Firebase token verified for registration. UID: {Uid}, Phone: {PhoneNumber}",
                    firebaseToken.Uid,
                    registerDto.PhoneNumber);

                var (customer, isNew) = await _customerService.RegisterAsync(registerDto.PhoneNumber, registerDto.UID);

                var response = new CustomerRegisterResponseDto
                {
                    Id = customer.Id,
                    UID = customer.UID,
                    PhoneNumber = customer.PhoneNumber,
                    IsPhoneVerified = customer.IsPhoneVerified,
                    IsNewCustomer = isNew,
                    CreatedAt = customer.CreatedAt
                };

                if (isNew)
                {
                    _logger.LogInformation("New customer registered: {CustomerId}, PhoneNumber: {PhoneNumber}",
                        customer.Id, customer.PhoneNumber);
                    return CreatedAtAction(nameof(GetById), new { id = customer.Id }, response);
                }

                _logger.LogInformation("Existing customer found: {CustomerId}, PhoneNumber: {PhoneNumber}",
                    customer.Id, customer.PhoneNumber);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Firebase token verification failed for registration");
                return Unauthorized(new { message = "Invalid Firebase authentication token." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Registration rejected for PhoneNumber: {PhoneNumber}", registerDto.PhoneNumber);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during customer registration for PhoneNumber: {PhoneNumber}",
                    registerDto.PhoneNumber);
                throw;
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerReadDto>>> GetAll()
        {
            _logger.LogInformation("GetAll customers called");
            var customers = await _customerService.GetAllAsync();
            var dtos = _mapper.Map<IEnumerable<CustomerReadDto>>(customers);
            _logger.LogDebug("GetAll returned {Count} customers", dtos.Count());
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerReadDto>> GetById(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();
            var dto = _mapper.Map<CustomerReadDto>(customer);
            return Ok(dto);
        }

        [HttpGet("uid/{uid}")]
        public async Task<ActionResult<CustomerReadDto>> GetByUid(string uid)
        {
            var customer = await _customerService.GetByUIdAsync(uid);
            if (customer == null) return NotFound();
            var dto = _mapper.Map<CustomerReadDto>(customer);
            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<CustomerReadDto>> Create(CustomerCreateDto createDto)
        {
            try
            {
                var customer = _mapper.Map<Customer>(createDto);
                var created = await _customerService.CreateAsync(customer);
                var dto = _mapper.Map<CustomerReadDto>(created);
                return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CustomerUpdateDto updateDto)
        {
      
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();
            _mapper.Map(updateDto, customer);
            var success = await _customerService.UpdateAsync(customer);
            if (!success) return StatusCode(StatusCodes.Status500InternalServerError);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _customerService.DeleteAsync(id);
            if (!success) return NotFound();
            return Ok();
        }

        [HttpGet("paged")]
        public async Task<ActionResult<PaginatedResult<CustomerReadDto>>> GetPaged(
            int page = 1, int pageSize = 10, string? searchTerm = null, bool? isActive = null, bool? isVerified = null)
        {
            var pagedResult = await _customerService.GetPagedAsync(page, pageSize, searchTerm, isActive, isVerified);
            var dtoResult = new PaginatedResult<CustomerReadDto>
            {
                Items = _mapper.Map<IEnumerable<CustomerReadDto>>(pagedResult.Items),
                TotalCount = pagedResult.TotalCount,
                Page = pagedResult.Page,
                PageSize = pagedResult.PageSize
            };
            return Ok(dtoResult);
        }

        /// <summary>
        /// Search customers by Name, Email, or Phone Number
        /// </summary>
        /// <param name="searchTerm">Search term to match against Name, Email, or Phone</param>
        /// <returns>List of customers matching the search criteria</returns>
        [HttpGet("search")]
        [ProducesResponseType(typeof(IEnumerable<CustomerReadDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<CustomerReadDto>>> SearchCustomers([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return BadRequest(new { message = "Search term cannot be empty." });

            var customers = await _customerService.SearchCustomersAsync(searchTerm);
            var dtos = _mapper.Map<IEnumerable<CustomerReadDto>>(customers);
            return Ok(dtos);
        }

        [HttpGet("{id}/kyc")]
        [ProducesResponseType(typeof(CustomerKycReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCustomerKyc(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            var kyc = await _customerService.GetCustomerKycAsync(id);
            if (kyc == null)
            {
                return Ok(new CustomerKycReadDto
                {
                    CustomerId = id,
                    AadharNumber = string.Empty,
                    Status = CustomerKycStatus.NotInitiated,
                    DocumentId = null,
                    AadharFrontDocumentId = null,
                    AadharBackDocumentId = null,
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    Address = customer.Address,
                    City = customer.City,
                    State = customer.State,
                    ZipCode = customer.ZipCode,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            var dto = _mapper.Map<CustomerKycReadDto>(kyc);
            dto.FirstName = customer.FirstName;
            dto.LastName = customer.LastName;
            dto.Address = customer.Address;
            dto.City = customer.City;
            dto.State = customer.State;
            dto.ZipCode = customer.ZipCode;
            return Ok(dto);
        }

        [HttpPost("{id}/kyc/submit")]
        [ProducesResponseType(typeof(CustomerKycReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SubmitCustomerKyc(int id, [FromBody] SubmitCustomerKycRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            try
            {
                var kyc = await _customerService.SubmitCustomerKycAsync(
                    id,
                    dto.AadharNumber,
                    dto.AadharFrontDocumentId,
                    dto.AadharBackDocumentId,
                    dto.FirstName,
                    dto.LastName,
                    dto.Address,
                    dto.City,
                    dto.State,
                    dto.ZipCode,
                    dto.DocumentId);
                if (kyc == null) return NotFound();
                var refreshedCustomer = await _customerService.GetByIdAsync(id);
                var readDto = _mapper.Map<CustomerKycReadDto>(kyc);
                readDto.FirstName = refreshedCustomer?.FirstName;
                readDto.LastName = refreshedCustomer?.LastName;
                readDto.Address = refreshedCustomer?.Address;
                readDto.City = refreshedCustomer?.City;
                readDto.State = refreshedCustomer?.State;
                readDto.ZipCode = refreshedCustomer?.ZipCode;
                return Ok(readDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/preferred-language")]
        [ProducesResponseType(typeof(CustomerReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdatePreferredLanguage(int id, [FromBody] UpdatePreferredLanguageDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var customer = await _customerService.UpdatePreferredLanguageAsync(id, dto.PreferredLanguageCode);
                if (customer == null) return NotFound();

                return Ok(_mapper.Map<CustomerReadDto>(customer));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/kyc/approve")]
        [ProducesResponseType(typeof(CustomerKycReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ApproveCustomerKyc(int id, [FromBody] CustomerKycApprovalDto dto)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            var kyc = await _customerService.ApproveCustomerKycAsync(id, dto.Approve);
            if (kyc == null) return NotFound();
            return Ok(_mapper.Map<CustomerKycReadDto>(kyc));
        }

        [HttpPatch("{id}/kyc/reject")]
        [ProducesResponseType(typeof(CustomerKycReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RejectCustomerKyc(int id, [FromBody] RejectCustomerVerificationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            var normalizedReason = dto.Reason?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedReason)) return BadRequest(new { message = "Rejection reason is required." });

            var kyc = await _customerService.RejectCustomerKycAsync(id, normalizedReason);
            if (kyc == null) return NotFound();
            return Ok(_mapper.Map<CustomerKycReadDto>(kyc));
        }

        [HttpGet("{id}/dl")]
        [ProducesResponseType(typeof(CustomerDlReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCustomerDl(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            var customerDl = await _customerService.GetCustomerDlAsync(id);
            if (customerDl == null)
            {
                return Ok(new CustomerDlReadDto
                {
                    CustomerId = id,
                    DrivingLicenceNumber = null,
                    Status = CustomerDLStatus.NotInitiated,
                    DrivingLicenceFrontDocumentId = null,
                    DrivingLicenceBackDocumentId = null,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            return Ok(_mapper.Map<CustomerDlReadDto>(customerDl));
        }

        [HttpPost("{id}/dl/submit")]
        [ProducesResponseType(typeof(CustomerDlReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SubmitCustomerDl(int id, [FromBody] SubmitCustomerDlRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            try
            {
                var customerDl = await _customerService.SubmitCustomerDlAsync(id, dto.DrivingLicenceNumber, dto.DrivingLicenceFrontDocumentId, dto.DrivingLicenceBackDocumentId);
                if (customerDl == null) return NotFound();
                return Ok(_mapper.Map<CustomerDlReadDto>(customerDl));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/dl/approve")]
        [ProducesResponseType(typeof(CustomerDlReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ApproveCustomerDl(int id, [FromBody] CustomerDlApprovalDto dto)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            var customerDl = await _customerService.ApproveCustomerDlAsync(id, dto.Approve);
            if (customerDl == null) return NotFound();
            return Ok(_mapper.Map<CustomerDlReadDto>(customerDl));
        }

        [HttpPatch("{id}/dl/reject")]
        [ProducesResponseType(typeof(CustomerDlReadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RejectCustomerDl(int id, [FromBody] RejectCustomerDlDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            var normalizedReason = dto.Reason?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedReason)) return BadRequest(new { message = "Rejection reason is required." });

            var customerDl = await _customerService.RejectCustomerDlAsync(id, normalizedReason);
            if (customerDl == null) return NotFound();
            return Ok(_mapper.Map<CustomerDlReadDto>(customerDl));
        }

        /// <summary>
        /// PUT api/customer/{id}/kyc-status
        /// Updates the KYC verification status for a customer.
        /// </summary>
        [HttpPut("{id}/kyc-status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateKycStatus(int id, [FromBody] UpdateKycStatusDto dto)
        {
            var success = await _customerService.UpdateKycStatusAsync(id, dto.Status);
            if (!success) return NotFound();
            return Ok(new { message = $"KYC status updated to {dto.Status}.", status = dto.Status });
        }

        /// <summary>
        /// GET api/customer/{id}/kyc-status
        /// Returns whether the customer's KYC is verified.
        /// </summary>
        [HttpGet("{id}/kyc-status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetKycStatus(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) return NotFound();

            var kyc = await _customerService.GetCustomerKycAsync(id);
            var status = kyc?.Status ?? CustomerKycStatus.NotInitiated;
            return Ok(new { customerId = customer.Id, status = status });
        }

        /// <summary>
        /// GET api/customer/{id}/payments
        /// Get all payments for a customer with pagination and filters.
        /// </summary>
        /// <param name="id">Customer ID</param>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 10)</param>
        /// <param name="paymentType">Filter by payment type (optional)</param>
        /// <param name="paymentStatus">Filter by payment status (optional)</param>
        /// <param name="searchTerm">Search by amount, payment ID, or transaction ID (optional)</param>
        [HttpGet("{id}/payments")]
        [ProducesResponseType(typeof(PaginatedResult<PaymentReadDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PaginatedResult<PaymentReadDto>>> GetCustomerPayments(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] PaymentType? paymentType = null,
            [FromQuery] PaymentStatus? paymentStatus = null,
            [FromQuery] string? searchTerm = null)
        {
            // Verify customer exists
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null) 
                return NotFound(new { message = $"Customer {id} not found" });

            var (payments, totalCount) = await _paymentService.GetCustomerPaymentsPagedAsync(
                customerId: id,
                page: page,
                pageSize: pageSize,
                status: paymentStatus,
                paymentType: paymentType,
                searchTerm: searchTerm);

            var paymentDtos = _mapper.Map<IEnumerable<PaymentReadDto>>(payments);

            var result = new PaginatedResult<PaymentReadDto>
            {
                Items = paymentDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return Ok(result);
        }

        /// <summary>
        /// Get customer wallet information and paginated transaction history with filtering and search.
        /// GET api/customer/{id}/wallet-transactions
        /// </summary>
        /// <param name="id">Customer ID</param>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 10, max: 100)</param>
        /// <param name="status">Filter by transaction status (Pending, Confirmed, Failed, Cancelled, Reversed)</param>
        /// <param name="transactionType">Filter by transaction type (Recharge, Payment, Withdrawal, Refund, Cashback, Adjustment, Expiry)</param>
        /// <param name="entryType">Filter by entry type (Credit, Debit)</param>
        /// <param name="searchTerm">Search by Amount or Transaction ID (ReferenceNo)</param>
        [HttpGet("{id:int}/wallet-transactions")]
        [ProducesResponseType(typeof(CustomerWalletDetailsDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<CustomerWalletDetailsDto>> GetCustomerWalletTransactions(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] WalletTransactionStatus? status = null,
            [FromQuery] WalletTransactionType? transactionType = null,
            [FromQuery] WalletEntryType? entryType = null,
            [FromQuery] string searchTerm = null)
        {
            // Verify customer exists
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null)
                return NotFound(new { message = $"Customer {id} not found" });

            // Enforce page size limits
            if (pageSize > 100) pageSize = 100;
            if (pageSize < 1) pageSize = 10;
            if (page < 1) page = 1;

            // Get wallet summary
            var wallet = await _walletService.GetWalletAsync(id);
            var walletSummary = new CustomerWalletSummaryDto
            {
                Id = wallet.Id,
                CustomerId = wallet.CustomerId,
                Balance = wallet.Balance,
                PendingWithdrawalAmount = wallet.PendingWithdrawalAmount,
                IsActive = wallet.IsActive,
                CreatedAt = wallet.CreatedAt,
                UpdatedAt = wallet.UpdatedAt
            };

            // Get paginated transactions with filters
            var (transactions, totalCount) = await _walletService.GetWalletTransactionsPagedAsync(
                customerId: id,
                page: page,
                pageSize: pageSize,
                status: status,
                transactionType: transactionType,
                entryType: entryType,
                searchTerm: searchTerm);

            // Map to DTOs
            var transactionDtos = transactions.Select(t => new WalletTransactionReadDto
            {
                Id = t.Id,
                WalletId = t.WalletId,
                TransactionType = t.TransactionType,
                EntryType = t.EntryType,
                Status = t.Status,
                Amount = t.Amount,
                BalanceBefore = t.BalanceBefore,
                BalanceAfter = t.BalanceAfter,
                BookingId = t.BookingId,
                PaymentId = t.PaymentId,
                ReferenceNo = t.ReferenceNo,
                PaymentGatewayTransactionId = t.PaymentGatewayTransactionId,
                CorrelationId = t.CorrelationId,
                AvailableOn = t.AvailableOn,
                Remarks = t.Remarks,
                CreatedAt = t.CreatedAt,
                ProcessedAt = t.ProcessedAt
            });

            var paginatedTransactions = new PaginatedWalletTransactionsDto
            {
                Items = transactionDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            var result = new CustomerWalletDetailsDto
            {
                WalletSummary = walletSummary,
                Transactions = paginatedTransactions
            };

            return Ok(result);
        }





        
       
    }
}
