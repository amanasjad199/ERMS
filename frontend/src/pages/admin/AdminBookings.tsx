import { useEffect, useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card, CardContent, Badge, PageSpinner, EmptyState, Button, Select, Modal, Pagination } from '../../components/ui';
import type { PaginationInfo } from '../../components/ui';
import { Booking, BookingStatus } from '../../types';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params: { status?: string; page?: number; limit?: number } = {
        page,
        limit: 12,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await adminApi.getAllBookings(params);
      setBookings(response.data.data.items);
      setPaginationInfo(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openActionModal = (booking: Booking, action: 'approve' | 'reject') => {
    setSelectedBooking(booking);
    setActionType(action);
    setAdminNotes('');
  };

  const handleAction = async () => {
    if (!selectedBooking || !actionType) return;

    setIsSubmitting(true);
    try {
      if (actionType === 'approve') {
        await adminApi.approveBooking(selectedBooking.id, adminNotes || undefined);
        toast.success('Booking approved');
      } else {
        await adminApi.rejectBooking(selectedBooking.id, adminNotes || undefined);
        toast.success('Booking rejected');
      }
      setSelectedBooking(null);
      setActionType(null);
      fetchBookings();
    } catch {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, 'yellow' | 'green' | 'red' | 'gray'> = {
      PENDING: 'yellow',
      APPROVED: 'green',
      REJECTED: 'red',
      CANCELLED: 'gray',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Booking Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and moderate booking requests
          </p>
        </div>

        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="sm:w-48"
        />
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Clock className="w-12 h-12" />}
            title="No bookings found"
            description={statusFilter ? `No ${statusFilter.toLowerCase()} bookings` : 'No bookings yet'}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="py-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {booking.title}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Resource: </span>
                        <span className="text-gray-900 dark:text-white">{booking.resource.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">User: </span>
                        <span className="text-gray-900 dark:text-white">
                          {booking.user.firstName} {booking.user.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Start: </span>
                        <span className="text-gray-900 dark:text-white">{formatDate(booking.startTime)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">End: </span>
                        <span className="text-gray-900 dark:text-white">{formatDate(booking.endTime)}</span>
                      </div>
                    </div>

                    {booking.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {booking.description}
                      </p>
                    )}

                    {booking.adminNotes && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Admin note: </span>
                        <span className="text-gray-600 dark:text-gray-400">{booking.adminNotes}</span>
                      </div>
                    )}
                  </div>

                  {booking.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => openActionModal(booking, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openActionModal(booking, 'reject')}
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {paginationInfo && (
        <Pagination pagination={paginationInfo} onPageChange={setPage} />
      )}

      {/* Action Modal */}
      <Modal
        isOpen={!!selectedBooking && !!actionType}
        onClose={() => {
          setSelectedBooking(null);
          setActionType(null);
        }}
        title={actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {actionType === 'approve'
              ? 'Are you sure you want to approve this booking?'
              : 'Are you sure you want to reject this booking?'}
          </p>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <p className="font-medium text-gray-900 dark:text-white">{selectedBooking?.title}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {selectedBooking?.resource.name} - {selectedBooking?.user.firstName} {selectedBooking?.user.lastName}
            </p>
          </div>

          <div>
            <label className="label">Admin Notes (optional)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Add a note for the user..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setSelectedBooking(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className={`flex-1 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              variant={actionType === 'reject' ? 'danger' : 'primary'}
              onClick={handleAction}
              isLoading={isSubmitting}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminBookings;
