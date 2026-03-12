import { useEffect, useState } from 'react';
import { MapPin, Users, Plus } from 'lucide-react';
import { resourceApi, bookingApi } from '../services/api';
import { Card, CardContent, Badge, PageSpinner, EmptyState, Button, Input, Select, Modal, Pagination } from '../components/ui';
import type { PaginationInfo } from '../components/ui';
import { Resource, ResourceCategory } from '../types';
import toast from 'react-hot-toast';

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const categories: { value: string; label: string }[] = [
    { value: '', label: 'All Categories' },
    { value: 'ROOM', label: 'Room' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'VEHICLE', label: 'Vehicle' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Debounced search with proper cleanup
  useEffect(() => {
    let isMounted = true;

    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const params: { category?: string; search?: string; available?: boolean; page?: number; limit?: number } = {
          available: true,
          page,
          limit: 12,
        };
        if (category) params.category = category;
        if (search) params.search = search;

        const response = await resourceApi.getAll(params);
        if (isMounted) {
          setResources(response.data.data.items);
          setPagination(response.data.data.pagination);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch resources:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchResources();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [category, search, page]);

  const openBookingModal = (resource: Resource) => {
    setSelectedResource(resource);
    setBookingForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
    });
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    setIsSubmitting(true);
    try {
      await bookingApi.create({
        resourceId: selectedResource.id,
        title: bookingForm.title,
        description: bookingForm.description || undefined,
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
      });
      toast.success('Booking request submitted!');
      setIsBookingModalOpen(false);
    } catch {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat: ResourceCategory) => {
    const colors: Record<ResourceCategory, 'gray' | 'green' | 'yellow' | 'red'> = {
      ROOM: 'gray',
      EQUIPMENT: 'green',
      VEHICLE: 'yellow',
      OTHER: 'gray',
    };
    return colors[cat];
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Resources
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Browse and book available resources
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1"
        />
        <Select
          options={categories}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="sm:w-48"
        />
      </div>

      {/* Resources grid */}
      {isLoading ? (
        <PageSpinner />
      ) : resources.length === 0 ? (
        <Card>
          <EmptyState
            title="No resources found"
            description="Try adjusting your search or filters"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} hover className="flex flex-col">
              <CardContent className="flex-1 py-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {resource.name}
                  </h3>
                  <Badge variant={getCategoryColor(resource.category)}>
                    {resource.category}
                  </Badge>
                </div>

                {resource.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  {resource.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{resource.location}</span>
                    </div>
                  )}
                  {resource.capacity && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Capacity: {resource.capacity}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-4"
                  size="sm"
                  onClick={() => openBookingModal(resource)}
                >
                  <Plus className="w-4 h-4" />
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title={`Book ${selectedResource?.name}`}
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <Input
            label="Booking Title"
            placeholder="e.g., Team Meeting"
            value={bookingForm.title}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Add any details about your booking..."
              value={bookingForm.description}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={bookingForm.startTime}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, startTime: e.target.value }))}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={bookingForm.endTime}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Resources;
