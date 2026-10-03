import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const BOOKING_DETAIL_CHUNK_RETRY_KEY = 'booking-detail-chunk-retry';

const lazyWithChunkRetry = (importer, retryKey) =>
  lazy(async () => {
    try {
      const module = await importer();
      window.sessionStorage?.removeItem(retryKey);
      return module;
    } catch (error) {
      const message = String(error?.message || '');
      const isChunkLoadError =
        /ChunkLoadError/i.test(message) ||
        /Loading chunk/i.test(message) ||
        /Failed to fetch dynamically imported module/i.test(message);

      if (!isChunkLoadError) {
        throw error;
      }

      const alreadyRetried = window.sessionStorage?.getItem(retryKey) === '1';
      if (!alreadyRetried) {
        window.sessionStorage?.setItem(retryKey, '1');
        window.location.reload();
      }

      throw error;
    }
  });

const Booking = lazy(() => import('../../container/booking/Booking'));
const BookingControl = lazy(() => import('../../container/booking/BookingControl'));
const BookingDetail = lazyWithChunkRetry(
  () => import('../../container/booking/BookingDetail'),
  BOOKING_DETAIL_CHUNK_RETRY_KEY,
);
const HandoverVehicleScreen = lazy(() => import('../../container/booking/HandoverVehicleScreen'));
const BookingPayments = lazy(() => import('../../container/booking/BookingPayments'));
const VehicleReturnScreen = lazy(() => import('../../container/booking/VehicleReturnScreen'));
const OwnershipTransferScreen = lazy(() => import('../../container/booking/OwnershipTransferScreen'));

function BookingRoutes() {
  return (
    <Routes>
      <Route path="list" element={<Booking />} />
      <Route path="control" element={<BookingControl />} />
      <Route path="detail/:id" element={<BookingDetail />} />
      <Route path="handover" element={<HandoverVehicleScreen />} />
      <Route path="handover/:id" element={<HandoverVehicleScreen />} />
      <Route path="assignment" element={<HandoverVehicleScreen />} />
      <Route path="assignment/:id" element={<HandoverVehicleScreen />} />
      <Route path="vehicle-return" element={<VehicleReturnScreen />} />
      <Route path="vehicle-return/:id" element={<VehicleReturnScreen />} />
      <Route path="ownership-transfer" element={<OwnershipTransferScreen />} />
      <Route path="ownership-transfer/:id" element={<OwnershipTransferScreen />} />
      <Route path="payments/:id" element={<BookingPayments />} />
      <Route path="*" element={<Booking />} />
    </Routes>
  );
}

export default BookingRoutes;
