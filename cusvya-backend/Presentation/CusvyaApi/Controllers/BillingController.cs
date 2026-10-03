using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Rush.Data.Services.Billings;

using Rush.Core.Domain.Billings;
using System.Collections.Generic;
using System.Threading.Tasks;
using Rush.Data.DTOs.Billings;
using Rush.Data.DTOs.Billings.Payments;
using Rush.Data.DTOs.Billings.Invoices;
using Rush.Data.DTOs.Billings.Subscriptions;

namespace RushApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;
        private readonly IMapper _mapper;
        public BillingController(IBillingService billingService, IMapper mapper)
        {
            _billingService = billingService;
            _mapper = mapper;
        }

        // CustomerBilling CRUD
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerBillingReadDto>>> GetAll()
        {
            var billings = await _billingService.GetAllCustomerBillingsAsync();
            return Ok(_mapper.Map<IEnumerable<CustomerBillingReadDto>>(billings));
        }

        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<CustomerBillingReadDto>>> GetByCustomer(int customerId)
        {
            var billings = await _billingService.GetCustomerBillingsByCustomerIdAsync(customerId);
            return Ok(_mapper.Map<IEnumerable<CustomerBillingReadDto>>(billings));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerBillingReadDto>> GetById(int id)
        {
            var billing = await _billingService.GetCustomerBillingByIdAsync(id);
            if (billing == null) return NotFound();
            return Ok(_mapper.Map<CustomerBillingReadDto>(billing));
        }

        [HttpGet("customer/{customerId}/latest")]
        public async Task<ActionResult<CustomerBillingReadDto>> GetLatestForCustomer(int customerId)
        {
            var billing = await _billingService.GetLatestCustomerBillingAsync(customerId);
            if (billing == null) return NotFound();
            return Ok(_mapper.Map<CustomerBillingReadDto>(billing));
        }

        [HttpPost]
        public async Task<ActionResult<CustomerBillingReadDto>> Create(CustomerBillingCreateDto dto)
        {
           
            var billing = _mapper.Map<CustomerBilling>(dto);
            var created = await _billingService.CreateCustomerBillingAsync(billing);
            var readDto = _mapper.Map<CustomerBillingReadDto>(created);
            return CreatedAtAction(nameof(GetById), new { id = readDto.Id }, readDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CustomerBillingUpdateDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var billing = _mapper.Map<CustomerBilling>(dto);
            var success = await _billingService.UpdateCustomerBillingAsync(billing);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _billingService.DeleteCustomerBillingAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        // Payments
        [HttpGet("{customerBillingId}/payments")]
        public async Task<ActionResult<IEnumerable<PaymentReadDto>>> GetPayments(int customerBillingId)
        {
            var payments = await _billingService.GetPaymentsForBillingAsync(customerBillingId);
            return Ok(_mapper.Map<IEnumerable<PaymentReadDto>>(payments));
        }

        [HttpPost("{customerBillingId}/payments")]
        public async Task<ActionResult<PaymentReadDto>> AddPayment(PaymentCreateDto dto)
        {
            var payment = _mapper.Map<Payment>(dto);
            
            var created = await _billingService.AddPaymentAsync(payment);
            var readDto = _mapper.Map<PaymentReadDto>(created);
            return CreatedAtAction(nameof(GetPayments), new { payment.CustomerBillingId }, readDto);
        }

        // Invoices
        [HttpGet("{customerBillingId}/invoices")]
        public async Task<ActionResult<IEnumerable<InvoiceReadDto>>> GetInvoices(int customerBillingId)
        {
            var invoices = await _billingService.GetInvoicesForBillingAsync(customerBillingId);
            return Ok(_mapper.Map<IEnumerable<InvoiceReadDto>>(invoices));
        }

        [HttpPost("{customerBillingId}/invoices")]
        public async Task<ActionResult<InvoiceReadDto>> GenerateInvoice(int customerBillingId, InvoiceCreateDto dto)
        {
            var invoice = await _billingService.GenerateInvoiceAsync(customerBillingId, dto.Amount);
            var readDto = _mapper.Map<InvoiceReadDto>(invoice);
            return CreatedAtAction(nameof(GetInvoices), new { customerBillingId }, readDto);
        }

        // Subscription
        [HttpGet("{customerBillingId}/subscription")]
        public async Task<ActionResult<SubscriptionReadDto>> GetSubscription(int customerBillingId)
        {
            var subscription = await _billingService.GetSubscriptionForBillingAsync(customerBillingId);
            if (subscription == null) return NotFound();
            return Ok(_mapper.Map<SubscriptionReadDto>(subscription));
        }

        [HttpPut("{customerBillingId}/subscription")]
        public async Task<IActionResult> UpdateSubscription(int customerBillingId, SubscriptionUpdateDto dto)
        {
            if (customerBillingId != dto.CustomerBillingId) return BadRequest();
            var subscription = _mapper.Map<Subscription>(dto);
            var success = await _billingService.UpdateSubscriptionAsync(subscription);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
