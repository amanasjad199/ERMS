import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Edit2, X } from 'lucide-react';
import { bookingApi } from '../services/api';
import { Card, CardContent, Badge, PageSpinner, EmptyState, Button, Select, Modal, Input, Pagination } from '../components/ui';
import type { PaginationInfo } from '../components/ui';
import { Booking, BookingStatus } from '../types';
import toast from 'react-hot-toast';

const Bookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });
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

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    if (newStatus) {
      setSearchParams({ status: newStatus });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params: { status?: string; page?: number; limit?: number } = {
          page,
          limit: 12,
        };
        if (statusFilter) params.status = statusFilter;

        const response = await bookingApi.getMyBookings(params);
        if (isMounted) {
          setBookings(response.data.data.items);
          setPaginationInfo(response.data.data.pagination);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch bookings:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [statusFilter, page]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;

      const response = await bookingApi.getMyBookings(params);
      setBookings(response.data.data.items);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingApi.cancel(bookingId);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch {
      // Error handled by interceptor
    }
  };

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      title: booking.title,
      description: booking.description || '',
      startTime: new Date(booking.startTime).toISOString().slice(0, 16),
      endTime: new Date(booking.endTime).toISOString().slice(0, 16),
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setIsSubmitting(true);
    try {
      await bookingApi.update(editingBooking.id, {
        title: editForm.title,
        description: editForm.description || null,
        startTime: new Date(editForm.startTime).toISOString(),
        endTime: new Date(editForm.endTime).toISOString(),
      });
      toast.success('Booking updated');
      setEditingBooking(null);
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

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            My Bookings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your booking requests
          </p>
        </div>

        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="sm:w-48"
        />
      </div>

      {/* Bookings list */}
      {isLoading ? (
        <PageSpinner />
      ) : bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No bookings found"
            description={statusFilter ? 'No bookings with this status' : 'You haven\'t made any bookings yet'}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {booking.title}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {booking.resource.name}
                    </p>

                    {booking.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {booking.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>to</span>
                        <span>{formatDate(booking.endTime)}</span>
                      </div>
                    </div>

                    {booking.adminNotes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Admin note: </span>
                        <span className="text-gray-600 dark:text-gray-400">{booking.adminNotes}</span>
                      </div>
                    )}
                  </div>

                  {booking.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(booking)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(booking.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
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

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        title="Edit Booking"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Booking Title"
            value={editForm.title}
            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={editForm.startTime}
              onChange={(e) => setEditForm((prev) => ({ ...prev, startTime: e.target.value }))}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={editForm.endTime}
              onChange={(e) => setEditForm((prev) => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setEditingBooking(null)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;
