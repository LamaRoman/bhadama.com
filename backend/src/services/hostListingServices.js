import { prisma } from "../config/prisma.js";

export const getListingsByHostId = (hostId) => {
  return prisma.listing.findMany({
    where: { hostId },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getListingByIdForHost = (id, hostId) => {
  return prisma.listing.findFirst({
    where: { id, hostId },
    include: { images: true },
  });
};

export const updateListingById = (id, hostId, data) => {
  return prisma.listing.update({
    where: { id },
    data,
  });
};

export const deleteListingById = async (id, hostId) => {
  await prisma.listing.delete({ where: { id } });
};

export const updateListingStatus = (id, hostId, status) => {
  return prisma.listing.update({
    where: { id },
    data: { status },
  });
};
