import 'dotenv/config';
import { PrismaClient, Role, ResourceCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const moderatorPassword = process.env.MODERATOR_PASSWORD;
  if (!superAdminPassword) {
    throw new Error('SUPER_ADMIN_PASSWORD environment variable is required for seeding');
  }
  if (!moderatorPassword) {
    throw new Error('MODERATOR_PASSWORD environment variable is required for seeding');
  }

  // Create Super Admin
  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 12);
  const hashedModeratorPassword = await bcrypt.hash(moderatorPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@erms.com' },
    update: { password: hashedSuperAdminPassword },
    create: {
      email: 'admin@erms.com',
      password: hashedSuperAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('Created/Updated Super Admin:', superAdmin.email);

  // Create Moderator
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@erms.com' },
    update: { password: hashedModeratorPassword },
    create: {
      email: 'moderator@erms.com',
      password: hashedModeratorPassword,
      firstName: 'Mod',
      lastName: 'User',
      role: Role.MODERATOR,
    },
  });
  console.log('Created/Updated Moderator:', moderator.email);

  // Create Sample Resources
  const resources = [
    // Rooms
    {
      name: 'Conference Room A',
      description: 'Large conference room with projector, whiteboard, and video conferencing setup',
      category: ResourceCategory.ROOM,
      capacity: 20,
      location: 'Building 1, Floor 2',
    },
    {
      name: 'Conference Room B',
      description: 'Medium conference room with 65" TV screen and wireless presentation',
      category: ResourceCategory.ROOM,
      capacity: 10,
      location: 'Building 1, Floor 3',
    },
    {
      name: 'Board Room',
      description: 'Executive board room with premium furniture and catering service available',
      category: ResourceCategory.ROOM,
      capacity: 16,
      location: 'Building 1, Floor 5',
    },
    {
      name: 'Meeting Pod 1',
      description: 'Small private meeting pod for quick discussions',
      category: ResourceCategory.ROOM,
      capacity: 4,
      location: 'Building 2, Floor 1',
    },
    {
      name: 'Meeting Pod 2',
      description: 'Small meeting pod with soundproofing for confidential calls',
      category: ResourceCategory.ROOM,
      capacity: 4,
      location: 'Building 2, Floor 1',
    },
    {
      name: 'Training Room',
      description: 'Large training room with 30 computer workstations and instructor podium',
      category: ResourceCategory.ROOM,
      capacity: 30,
      location: 'Building 3, Floor 1',
    },
    {
      name: 'Auditorium',
      description: 'Main auditorium with stage, sound system, and seating for 200 people',
      category: ResourceCategory.ROOM,
      capacity: 200,
      location: 'Main Building, Ground Floor',
    },
    {
      name: 'Interview Room',
      description: 'Quiet room for interviews and one-on-one meetings',
      category: ResourceCategory.ROOM,
      capacity: 3,
      location: 'HR Building, Floor 1',
    },
    // Equipment
    {
      name: 'Projector - Epson EB-X51',
      description: 'Portable projector with HDMI and VGA support, 3600 lumens',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'IT Storage Room',
    },
    {
      name: 'Projector - BenQ MW535A',
      description: 'Wireless projector with screen mirroring capability',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'IT Storage Room',
    },
    {
      name: 'Video Camera - Canon XA40',
      description: 'Professional 4K video camera for event recording',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'Media Room',
    },
    {
      name: 'DSLR Camera - Nikon D850',
      description: 'High-resolution DSLR camera for photography',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'Media Room',
    },
    {
      name: 'Portable PA System',
      description: 'Wireless PA system with 2 microphones, suitable for events up to 100 people',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'Events Storage',
    },
    {
      name: 'Laptop - MacBook Pro 16"',
      description: 'High-performance laptop for presentations and demos',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'IT Department',
    },
    {
      name: 'Laptop - Dell XPS 15',
      description: 'Windows laptop with touchscreen for presentations',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'IT Department',
    },
    {
      name: 'Video Conferencing Kit',
      description: 'Logitech Rally system with 4K camera and speakerphone',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'IT Storage Room',
    },
    {
      name: 'Whiteboard - Mobile',
      description: 'Large mobile whiteboard on wheels',
      category: ResourceCategory.EQUIPMENT,
      capacity: null,
      location: 'Office Supplies',
    },
    // Vehicles
    {
      name: 'Company Van',
      description: '12-seater van for team transport with air conditioning',
      category: ResourceCategory.VEHICLE,
      capacity: 12,
      location: 'Parking Lot B',
    },
    {
      name: 'Sedan - Toyota Camry',
      description: 'Comfortable sedan for client pickups and business travel',
      category: ResourceCategory.VEHICLE,
      capacity: 4,
      location: 'Parking Lot A',
    },
    {
      name: 'SUV - Ford Explorer',
      description: 'Large SUV for off-site meetings and airport transfers',
      category: ResourceCategory.VEHICLE,
      capacity: 6,
      location: 'Parking Lot A',
    },
    {
      name: 'Mini Bus',
      description: '25-seater mini bus for large group transportation',
      category: ResourceCategory.VEHICLE,
      capacity: 25,
      location: 'Parking Lot C',
    },
    // Other
    {
      name: 'Event Tent - Large',
      description: '20x20 ft outdoor tent for events and exhibitions',
      category: ResourceCategory.OTHER,
      capacity: 50,
      location: 'Facilities Storage',
    },
    {
      name: 'Portable Stage',
      description: 'Modular stage platform (12x8 ft) for presentations and performances',
      category: ResourceCategory.OTHER,
      capacity: null,
      location: 'Facilities Storage',
    },
    {
      name: 'Folding Tables Set',
      description: 'Set of 10 folding tables for events',
      category: ResourceCategory.OTHER,
      capacity: null,
      location: 'Facilities Storage',
    },
    {
      name: 'Folding Chairs Set',
      description: 'Set of 50 folding chairs for events',
      category: ResourceCategory.OTHER,
      capacity: 50,
      location: 'Facilities Storage',
    },
  ];

  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { id: resource.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: resource,
    });
  }
  console.log('Created sample resources');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
