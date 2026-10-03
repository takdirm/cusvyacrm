using AutoMapper;
using Scootr.Core.Domain.Billings;
using Scootr.Core.Domain.Customers;
using Scootr.Core.Domain.Documents;
using Scootr.Core.Domain.Plans;
using Scootr.Core.Domain.Stations;
using Scootr.Core.Domain.Users;
using Scootr.Core.Domain.Vehicles;
using Scootr.Data.DTOs.Billings;
using Scootr.Data.DTOs.Billings.Invoices;
using Scootr.Data.DTOs.Billings.Payments;
using Scootr.Data.DTOs.Billings.Subscriptions;
using Scootr.Data.DTOs.Users;
using Scootr.Core.Domain.Billing;
using Scootr.Data.Dtos.Customers;
using Scootr.Data.Dtos.Documents;
using Scootr.Data.Dtos.Plans;
using Scootr.Data.Dtos.Stations;
using Scootr.Data.Dtos.Vehicles;
using Scootr.Data.Dtos.Trackers;
using Scootr.Core.Domain.Gprs;
using Scootr.Data.DTOs.GPRS;
using System;
using System.Collections.Generic;
using System.Linq;



namespace Scootr.Data.Mapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {

            // User
            CreateMap<User, UserDto>().ReverseMap();
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>();

            // User - Firebase DTOs
            CreateMap<User, UserResponseDto>()
                .ForMember(dest => dest.FirebaseUid, opt => opt.MapFrom(src => src.UID));
            CreateMap<CreateUserWithFirebaseDto, User>()
                .ForMember(dest => dest.Level, opt => opt.MapFrom(src => Enum.Parse<UserLevel>(src.Level, true)))
                .ForMember(dest => dest.Password, opt => opt.Ignore())
                .ForMember(dest => dest.UID, opt => opt.Ignore());
            CreateMap<UpdateUserWithFirebaseDto, User>()
                .ForMember(dest => dest.Level, opt => opt.MapFrom(src => 
                    !string.IsNullOrWhiteSpace(src.Level) ? Enum.Parse<UserLevel>(src.Level, true) : default(UserLevel?)))
                .ForMember(dest => dest.Password, opt => opt.Ignore())
                .ForMember(dest => dest.UID, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));


            // Document
            CreateMap<Document, DocumentReadDto>();
            CreateMap<DocumentCreateDto, Document>();
            CreateMap<DocumentUpdateDto, Document>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<DocumentTemplate, DocumentTemplateReadDto>();
            CreateMap<DocumentTemplateCreateUpdateDto, DocumentTemplate>();
            CreateMap<DocumentTemplateMappingParameter, DocumentTemplateMappingParameterDto>().ReverseMap();

            // Customer
            CreateMap<Customer, CustomerReadDto>()
                .ForMember(dest => dest.RegionCode,
                    opt => opt.MapFrom(src => src.Region != null ? src.Region.Code : string.Empty))
                .ForMember(dest => dest.RegionName,
                    opt => opt.MapFrom(src => src.Region != null ? src.Region.Name : string.Empty))
                .ForMember(dest => dest.CustomerKycStatus,
                    opt => opt.MapFrom(src => src.CustomerKYC != null ? src.CustomerKYC.Status : CustomerKycStatus.NotInitiated))
                .ForMember(dest => dest.CustomerDLStatus,
                    opt => opt.MapFrom(src => src.CustomerDL != null ? src.CustomerDL.Status : CustomerDLStatus.NotInitiated));
            CreateMap<CustomerCreateDto, Customer>();
            CreateMap<CustomerUpdateDto, Customer>();
            CreateMap<CustomerKYC, CustomerKycReadDto>();
            CreateMap<CustomerKycCreateDto, CustomerKYC>();
            CreateMap<CustomerKycUpdateDto, CustomerKYC>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<CustomerDL, CustomerDlReadDto>();
            CreateMap<CustomerDlCreateDto, CustomerDL>();
            CreateMap<CustomerDlUpdateDto, CustomerDL>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Station
            CreateMap<Station, StationReadDto>()
                .ForMember(dest => dest.RegionCode, opt => opt.MapFrom(src => src.Region != null ? src.Region.Code : string.Empty))
                .ForMember(dest => dest.RegionName, opt => opt.MapFrom(src => src.Region != null ? src.Region.Name : string.Empty))
                .ForMember(dest => dest.TotalVehicles, opt => opt.MapFrom(src => src.Vehicles != null ? src.Vehicles.Count : 0))
                .ReverseMap();
            CreateMap<StationCreateDto, Station>();
            CreateMap<StationUpdateDto, Station>();
            CreateMap<Station, NearestStationDto>()
                .ForMember(dest => dest.RegionCode, opt => opt.MapFrom(src => src.Region != null ? src.Region.Code : string.Empty))
                .ForMember(dest => dest.RegionName, opt => opt.MapFrom(src => src.Region != null ? src.Region.Name : string.Empty))
                .ForMember(dest => dest.TotalVehicles, opt => opt.MapFrom(src => src.Vehicles != null ? src.Vehicles.Count : 0));

            // StationInventory mappings removed - replaced by direct Vehicle.StationId FK

            // Vehicle
            CreateMap<Vehicle, VehicleReadDto>()
                .ForMember(dest => dest.RegionCode, opt => opt.MapFrom(src => src.Region != null ? src.Region.Code : string.Empty))
                .ForMember(dest => dest.RegionName, opt => opt.MapFrom(src => src.Region != null ? src.Region.Name : string.Empty))
                .ForMember(dest => dest.StationName, opt => opt.MapFrom(src => src.Station != null ? src.Station.Name : null))
                .ForMember(dest => dest.VehicleModel, opt => opt.MapFrom(src => src.VehicleModel))
                .ForMember(dest => dest.VehicleCatalogueName, opt => opt.MapFrom(src => src.VehicleCatalogue != null ? (src.VehicleCatalogue.Brand + " " + src.VehicleCatalogue.Model).Trim() : string.Empty))
                .ForMember(dest => dest.CatalogueColorName, opt => opt.MapFrom(src => src.CatalogueColor != null ? src.CatalogueColor.ColorName : string.Empty))
                .ForMember(dest => dest.VehicleCatalogueSummary, opt => opt.MapFrom(src => src.VehicleCatalogue != null ? (src.VehicleCatalogue.Brand + " " + src.VehicleCatalogue.Model + " " + src.VehicleCatalogue.Year).Trim() : null))
                .ForMember(dest => dest.CatalogueColor, opt => opt.MapFrom(src => src.CatalogueColor))
                .ForMember(dest => dest.Features, opt => opt.MapFrom(src => src.Features))
                .ReverseMap();
            CreateMap<VehicleCreateDto, Vehicle>();
            CreateMap<VehicleUpdateDto, Vehicle>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<CatalogueAddVehicleDto, Vehicle>();
            CreateMap<CatalogueUpdateVehicleDto, Vehicle>();

            // VehicleModel
            CreateMap<VehicleModel, VehicleModelReadDto>()
                .ForMember(dest => dest.VehicleCount, opt => opt.MapFrom(src => src.Vehicles != null ? src.Vehicles.Count : 0))
                .ForMember(dest => dest.RentalPlans, opt => opt.MapFrom(src =>
                    src.VehicleTypeRentalPlans != null
                    ? src.VehicleTypeRentalPlans.Select(x => x.RentalPlan).ToList()
                    : new List<RentalPlan>()))
                .ForMember(dest => dest.OwnershipPlans, opt => opt.MapFrom(src =>
                    src.VehicleTypeOwnershipPlans != null
                    ? src.VehicleTypeOwnershipPlans.Select(x => x.OwnershipPlan).ToList()
                    : new List<OwnershipPlan>()));
            CreateMap<VehicleModelCreateDto, VehicleModel>();
            CreateMap<VehicleModelUpdateDto, VehicleModel>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // VehicleFeature
            CreateMap<VehicleFeature, VehicleFeatureReadDto>().ReverseMap();
            CreateMap<VehicleFeatureCreateDto, VehicleFeature>();
            CreateMap<VehicleFeatureUpdateDto, VehicleFeature>();

            // Accessorie
            CreateMap<Accessorie, AccessorieReadDto>().ReverseMap();
            CreateMap<AccessorieCreateDto, Accessorie>();
            CreateMap<AccessorieUpdateDto, Accessorie>();

            // CustomerWallet
            CreateMap<CustomerWallet, CustomerWalletReadDto>().ReverseMap();
            CreateMap<CustomerWalletCreateDto, CustomerWallet>();
            CreateMap<CustomerWalletUpdateDto, CustomerWallet>();

            // WalletTransaction
            CreateMap<WalletTransaction, WalletTransactionReadDto>().ReverseMap();
            CreateMap<WalletTransactionCreateDto, WalletTransaction>();
            CreateMap<WalletTransactionUpdateDto, WalletTransaction>();

            // ========== END BOOKING MAPPINGS ==========

            // Invoice
            CreateMap<Invoice, InvoiceReadDto>().ReverseMap();
            CreateMap<InvoiceCreateDto, Invoice>();
            CreateMap<InvoiceUpdateDto, Invoice>();

            // Payment
            CreateMap<Payment, PaymentReadDto>().ReverseMap();


            CreateMap<PaymentCreateDto, Payment>();
            CreateMap<PaymentUpdateDto, Payment>();

            // Subscription
            CreateMap<Subscription, SubscriptionReadDto>().ReverseMap();
            CreateMap<SubscriptionCreateDto, Subscription>();
            CreateMap<SubscriptionUpdateDto, Subscription>();








            // CustomerBilling
            // Map domain -> read DTO, populate Amount from Subscription when present and map nested collections explicitly.
            CreateMap<CustomerBilling, CustomerBillingReadDto>()
                .ForMember(dest => dest.Subscription, opt => opt.MapFrom(src => src.Subscription))
                .ForMember(dest => dest.Payments, opt => opt.MapFrom(src => src.Payments ?? new List<Payment>()))
                .ForMember(dest => dest.Invoices, opt => opt.MapFrom(src => src.Invoices ?? new List<Invoice>()));

            // Create/Update DTO -> domain
            // Ignore Subscription mapping here to avoid overwriting nested subscription unintentionally.
            CreateMap<CustomerBillingCreateDto, CustomerBilling>()
                .ForMember(dest => dest.Subscription, opt => opt.Ignore())
                .ForMember(dest => dest.Payments, opt => opt.Ignore())
                .ForMember(dest => dest.Invoices, opt => opt.Ignore());

            CreateMap<CustomerBillingUpdateDto, CustomerBilling>()
                .ForMember(dest => dest.Subscription, opt => opt.Ignore())
                .ForMember(dest => dest.Payments, opt => opt.Ignore())
                .ForMember(dest => dest.Invoices, opt => opt.Ignore());


            // Payment
            CreateMap<Payment, PaymentReadDto>().ReverseMap();
            CreateMap<PaymentCreateDto, Payment>();
            CreateMap<PaymentUpdateDto, Payment>();

            // Invoice
            CreateMap<Invoice, InvoiceReadDto>().ReverseMap();
            CreateMap<InvoiceCreateDto, Invoice>();
            CreateMap<InvoiceUpdateDto, Invoice>();

            // PaymentOrder <-> DTO mappings with PaymentOrderStatus enum

            CreateMap<PaymentOrder, PaymentOrderReadDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status)); // enum to enum

            CreateMap<PaymentOrderCreateDto, PaymentOrder>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status)); // enum to enum

            CreateMap<PaymentOrderUpdateDto, PaymentOrder>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status)); // enum to enum

            // VehicleCatalogue
            CreateMap<VehicleCatalogue, VehicleCatalogueReadDto>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => $"{src.Brand} {src.Model} {src.Year}"))
                .ForMember(dest => dest.VehicleModelName, opt => opt.MapFrom(src => src.VehicleModel != null ? src.VehicleModel.Name : string.Empty))
                .ForMember(dest => dest.VehicleType, opt => opt.MapFrom(src => src.VehicleType))
                .ForMember(dest => dest.VehicleCategory, opt => opt.MapFrom(src => src.VehicleCategory));
            CreateMap<VehicleCatalogueCreateDto, VehicleCatalogue>()
                .ForMember(dest => dest.VehicleType, opt => opt.MapFrom(src => src.VehicleType))
                .ForMember(dest => dest.VehicleCategory, opt => opt.MapFrom(src => src.VehicleCategory));
            CreateMap<VehicleCatalogueUpdateDto, VehicleCatalogue>()
                .ForMember(dest => dest.VehicleType, opt => opt.MapFrom(src => src.VehicleType))
                .ForMember(dest => dest.VehicleCategory, opt => opt.MapFrom(src => src.VehicleCategory));

            CreateMap<CatalogueColor, CatalogueColorReadDto>();
            CreateMap<CatalogueColor, CatalogueColorDetailDto>();
            CreateMap<CatalogueColorCreateUpdateDto, CatalogueColor>();
            CreateMap<CatalogueImage, CatalogueImageReadDto>();
            CreateMap<CatalogueVendor, CatalogueVendorReadDto>()
                .ForMember(dest => dest.CatalogueName, opt => opt.MapFrom(src => src.Catalogue != null ? $"{src.Catalogue.Brand} {src.Catalogue.Model}".Trim() : string.Empty))
                .ForMember(dest => dest.VendorName, opt => opt.MapFrom(src => src.Vendor != null ? src.Vendor.Name : string.Empty))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive));

            // TrackerDevice
            CreateMap<TrackerDevice, TrackerDeviceReadDto>().ReverseMap();
            CreateMap<TrackerDevice, TrackerSearchResultDto>()
                .ForMember(dest => dest.Imei, opt => opt.MapFrom(src => src.IMEI));
            CreateMap<TrackerDeviceCreateDto, TrackerDevice>()
                .ForMember(dest => dest.PlanExpiryDate, opt =>
                {
                    opt.Condition(src => src.PlanExpiryDate.HasValue);
                    opt.MapFrom(src => src.PlanExpiryDate!.Value);
                });
            CreateMap<TrackerDeviceUpdateDto, TrackerDevice>()
                .ForMember(dest => dest.PlanExpiryDate, opt =>
                {
                    opt.Condition(src => src.PlanExpiryDate.HasValue);
                    opt.MapFrom(src => src.PlanExpiryDate!.Value);
                });

            // GPRS
            CreateMap<GprsTerminalCurrent, GprsTerminalCurrentReadDto>().ReverseMap();
            CreateMap<GprsTerminalCurrentCreateDto, GprsTerminalCurrent>();
            CreateMap<GprsTerminalCurrentUpdateDto, GprsTerminalCurrent>();

            CreateMap<GprsTerminalHistory, GprsTerminalHistoryReadDto>().ReverseMap();
            CreateMap<GprsTerminalHistoryCreateDto, GprsTerminalHistory>();
            CreateMap<GprsTerminalHistoryUpdateDto, GprsTerminalHistory>();

            CreateMap<GprsHeartbeatCurrent, GprsHeartbeatCurrentReadDto>().ReverseMap();
            CreateMap<GprsHeartbeatCurrentCreateDto, GprsHeartbeatCurrent>();
            CreateMap<GprsHeartbeatCurrentUpdateDto, GprsHeartbeatCurrent>();

            CreateMap<GprsHeartbeatHistory, GprsHeartbeatHistoryReadDto>().ReverseMap();
            CreateMap<GprsHeartbeatHistoryCreateDto, GprsHeartbeatHistory>();
            CreateMap<GprsHeartbeatHistoryUpdateDto, GprsHeartbeatHistory>();

            CreateMap<GprsLocationCurrent, GprsLocationCurrentReadDto>().ReverseMap();
            CreateMap<GprsLocationCurrentCreateDto, GprsLocationCurrent>();
            CreateMap<GprsLocationCurrentUpdateDto, GprsLocationCurrent>();

            CreateMap<GprsLocationHistory, GprsLocationHistoryReadDto>().ReverseMap();
            CreateMap<GprsLocationHistoryCreateDto, GprsLocationHistory>();
            CreateMap<GprsLocationHistoryUpdateDto, GprsLocationHistory>();

            // VehicleModel
            CreateMap<VehicleModel, VehicleModelReadDto>()
                .ForMember(dest => dest.VehicleCount, opt => opt.MapFrom(src => src.Vehicles != null ? src.Vehicles.Count : 0))
                .ForMember(dest => dest.RentalPlans, opt => opt.MapFrom(src =>
                    src.VehicleTypeRentalPlans != null
                        ? src.VehicleTypeRentalPlans.Select(x => x.RentalPlan).ToList()
                        : new System.Collections.Generic.List<RentalPlan>()))
                .ForMember(dest => dest.OwnershipPlans, opt => opt.MapFrom(src =>
                    src.VehicleTypeOwnershipPlans != null
                        ? src.VehicleTypeOwnershipPlans.Select(x => x.OwnershipPlan).ToList()
                        : new System.Collections.Generic.List<OwnershipPlan>()));
            CreateMap<VehicleModelCreateDto, VehicleModel>();
            CreateMap<VehicleModelUpdateDto, VehicleModel>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Vehicle
            CreateMap<Vehicle, VehicleReadDto>()
                .ForMember(dest => dest.RegionCode, opt => opt.MapFrom(src => src.Region != null ? src.Region.Code : string.Empty))
                .ForMember(dest => dest.RegionName, opt => opt.MapFrom(src => src.Region != null ? src.Region.Name : string.Empty))
                .ForMember(dest => dest.VehicleModel, opt => opt.MapFrom(src => src.VehicleModel))
                .ForMember(dest => dest.CatalogueColor, opt => opt.MapFrom(src => src.CatalogueColor))
                .ForMember(dest => dest.VehicleCatalogueName, opt => opt.MapFrom(src => src.VehicleCatalogue != null ? (src.VehicleCatalogue.Brand + " " + src.VehicleCatalogue.Model).Trim() : string.Empty))
                .ForMember(dest => dest.CatalogueColorName, opt => opt.MapFrom(src => src.CatalogueColor != null ? src.CatalogueColor.ColorName : string.Empty))
                .ForMember(dest => dest.VehicleCatalogueSummary, opt => opt.MapFrom(src => src.VehicleCatalogue != null ? src.VehicleCatalogue.Summary : null))
                .ForMember(dest => dest.StationName, opt => opt.MapFrom(src => src.Station != null ? src.Station.Name : null));
            CreateMap<VehicleCreateDto, Vehicle>();
            CreateMap<VehicleUpdateDto, Vehicle>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // VehicleFeature
            CreateMap<VehicleFeature, VehicleFeatureReadDto>().ReverseMap();
            CreateMap<VehicleFeatureCreateDto, VehicleFeature>();
            CreateMap<VehicleFeatureUpdateDto, VehicleFeature>();

            // RentalPlan
            CreateMap<RentalPlan, RentalPlanReadDto>().ReverseMap();
            CreateMap<RentalPlanCreateDto, RentalPlan>();
            CreateMap<RentalPlanUpdateDto, RentalPlan>();

            // RentalPlanDetail
            CreateMap<RentalPlanDetail, RentalPlanDetailReadDto>()
                .ForMember(dest => dest.RentalPlanName,
                    opt => opt.MapFrom(src => src.RentalPlan != null ? src.RentalPlan.Name : null));
            CreateMap<RentalPlanDetailCreateDto, RentalPlanDetail>();
            CreateMap<RentalPlanDetailUpdateDto, RentalPlanDetail>();

            // OwnershipPlan
            CreateMap<OwnershipPlan, OwnershipPlanReadDto>()
                .ForMember(dest => dest.VehicleCatalogueName,
                    opt => opt.MapFrom(src => src.VehicleCatalogue != null ? (src.VehicleCatalogue.Brand + " " + src.VehicleCatalogue.Model) : null));
            CreateMap<OwnershipPlanCreateDto, OwnershipPlan>();
            CreateMap<OwnershipPlanUpdateDto, OwnershipPlan>();

            // OwnershipPlanFeature
            CreateMap<OwnershipPlanFeature, OwnershipPlanFeatureReadDto>().ReverseMap();
            CreateMap<OwnershipPlanFeatureCreateDto, OwnershipPlanFeature>();
            CreateMap<OwnershipPlanFeatureUpdateDto, OwnershipPlanFeature>();

            // ActivePlan
            CreateMap<ActivePlan, ActivePlanReadDto>().ReverseMap();
            CreateMap<ActivePlanCreateDto, ActivePlan>();
            CreateMap<ActivePlanUpdateDto, ActivePlan>();

            // Unified Booking
            CreateMap<Booking, BookingReadDto>()
                .ForMember(d => d.CustomerName, o => o.MapFrom(s =>
                    s.Customer != null ? string.Join(" ", new[] { s.Customer.FirstName, s.Customer.LastName }.Where(n => !string.IsNullOrWhiteSpace(n))) : null))
                .ForMember(d => d.PhoneNumber, o => o.MapFrom(s => s.Customer != null ? s.Customer.PhoneNumber : null))
                .ForMember(d => d.RegionCode, o => o.MapFrom(s => s.Region != null ? s.Region.Code : string.Empty))
                .ForMember(d => d.RegionName, o => o.MapFrom(s => s.Region != null ? s.Region.Name : string.Empty))
                .ForMember(d => d.StationName, o => o.MapFrom(s => s.Station != null ? s.Station.Name : null))
                .ForMember(d => d.VehicleModelName, o => o.MapFrom(s => s.VehicleModel != null ? s.VehicleModel.Name : null))
                .ForMember(d => d.VehicleName, o => o.MapFrom(s =>
                    s.Vehicle != null ? s.Vehicle.Name :
                    s.AlternateVehicle != null ? s.AlternateVehicle.Name : null))
                .ForMember(d => d.VehicleRegisterationNumber, o => o.MapFrom(s =>
                    s.Vehicle != null ? s.Vehicle.RegisterationNumber :
                    s.AlternateVehicle != null ? s.AlternateVehicle.RegisterationNumber : null))
                .ForMember(d => d.CurrentOdometerReading, o => o.MapFrom(s =>
                    s.Vehicle != null ? s.Vehicle.CurrentOdometerReading :
                    s.AlternateVehicle != null ? s.AlternateVehicle.CurrentOdometerReading : 0))
                .ForMember(d => d.VehicleImageUrl, o => o.MapFrom(s =>
                    s.Vehicle != null ? s.Vehicle.ImageUrl :
                    s.AlternateVehicle != null ? s.AlternateVehicle.ImageUrl : null))
                .ForMember(d => d.VehicleListingStatus, o => o.MapFrom(s =>
                    s.Vehicle != null ? (VehicleListingStatus?)s.Vehicle.VehicleListingStatus :
                    s.AlternateVehicle != null ? (VehicleListingStatus?)s.AlternateVehicle.VehicleListingStatus : null))
                .ForMember(d => d.VehicleCatalogueName, o => o.MapFrom(s => s.VehicleCatalogue != null ? (s.VehicleCatalogue.Brand + " " + s.VehicleCatalogue.Model) : null))
                .ForMember(d => d.Catalogue, o => o.MapFrom(s =>
                    s.Catalogue != null
                        ? new BookingCatalogueDto
                        {
                            Id = s.Catalogue.Id,
                            Name = (s.Catalogue.Brand + " " + s.Catalogue.Model).Trim()
                        }
                        : null))
                .ForMember(d => d.CatalogueColor, o => o.MapFrom(s =>
                    s.CatalogueColor != null
                        ? new BookingCatalogueColorDto
                        {
                            Id = s.CatalogueColor.Id,
                            ColorName = s.CatalogueColor.ColorName,
                            ColorCode = s.CatalogueColor.ColorCode
                        }
                        : null))
                .ForMember(d => d.AlternateVehicleName, o => o.MapFrom(s => s.AlternateVehicle != null ? s.AlternateVehicle.Name : null))
                .ForMember(d => d.CustomerKycStatus, o => o.MapFrom(s => s.Customer != null && s.Customer.CustomerKYC != null ? s.Customer.CustomerKYC.Status : CustomerKycStatus.NotInitiated))
                .ForMember(d => d.CustomerKycRejectionReason, o => o.MapFrom(s => s.Customer != null && s.Customer.CustomerKYC != null ? s.Customer.CustomerKYC.RejectionReason : null))
                .ForMember(d => d.CustomerDLStatus, o => o.MapFrom(s => s.Customer != null && s.Customer.CustomerDL != null ? s.Customer.CustomerDL.Status : CustomerDLStatus.NotInitiated))
                .ForMember(d => d.CustomerDLRejectionReason, o => o.MapFrom(s => s.Customer != null && s.Customer.CustomerDL != null ? s.Customer.CustomerDL.RejectionReason : null))
                .ForMember(d => d.RentalPlanName, o => o.MapFrom(s => s.RentalPlan != null ? s.RentalPlan.Name : null))
                .ForMember(d => d.OwnershipPlanName, o => o.MapFrom(s => s.OwnershipPlan != null ? s.OwnershipPlan.Tenure : null));

            CreateMap<Booking, BookingActiveReadDto>()
                .IncludeBase<Booking, BookingReadDto>()
                .ForMember(d => d.Vehicle, o => o.MapFrom(s => s.Vehicle ?? s.AlternateVehicle));

            CreateMap<BookingControl, BookingControlReadDto>();
            CreateMap<BookingControlUpsertDto, BookingControl>();

            CreateMap<Vehicle, BookingActiveVehicleReadDto>()
                .ForMember(d => d.OilElectricityStatus, o => o.MapFrom(s => s.GprsHeartbeatCurrent != null ? s.GprsHeartbeatCurrent.OilElectricityStatus : string.Empty))
                .ForMember(d => d.AccStatus, o => o.MapFrom(s => s.GprsHeartbeatCurrent != null ? s.GprsHeartbeatCurrent.AccStatus : string.Empty));

            CreateMap<BookingCreateDto, Booking>()
                .ForMember(d => d.VehicleCategory, o => o.Ignore())
                .ForMember(d => d.KMDriven, o => o.MapFrom(s => 0));
            CreateMap<BookingUpdateDto, Booking>()
                .ForAllMembers(o => o.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<BookingAccessorie, BookingAccessoryReadDto>()
                .ForMember(d => d.AccessorieName, o => o.MapFrom(s => s.Accessorie.Name))
                .ForMember(d => d.AccessorieDescription, o => o.MapFrom(s => s.Accessorie.Description))
                .ForMember(d => d.SalePrice, o => o.MapFrom(s => s.Accessorie.SalePrice))
                .ForMember(d => d.RentalPricePerDay, o => o.MapFrom(s => s.Accessorie.RentalPricePerDay))
                .ForMember(d => d.ForSaleOnly, o => o.MapFrom(s => s.Accessorie.ForSaleOnly));
        }
    }
}
