"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const MAX_SHIFT_DURATION_MS = 10 * 60 * 60 * 1000; // 10 hours

export async function getOrCreateActiveShift() {
  const session = await getSession();
  if (!session || session.role !== "WORKER") {
    return null;
  }

  const activeShift = await prisma.shift.findFirst({
    where: {
      workerId: session.userId,
      endTime: null,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  if (activeShift) {
    // Check if it exceeded 10 hours
    const now = new Date();
    const elapsed = now.getTime() - activeShift.startTime.getTime();

    if (elapsed > MAX_SHIFT_DURATION_MS) {
      // Auto-close shift at 10 hours
      await prisma.shift.update({
        where: { id: activeShift.id },
        data: { endTime: new Date(activeShift.startTime.getTime() + MAX_SHIFT_DURATION_MS) },
      });
      // Start a new one since they just opened the page?
      // "Человек заходит... начинается отсчет"
      // Wait, if it auto-closed, do we start a new one automatically right now?
      // Yes, if they are still logged in and open the tracker.
      const newShift = await prisma.shift.create({
        data: {
          workerId: session.userId,
          startTime: new Date(),
        },
      });
      return newShift;
    }

    return activeShift;
  }

  // No active shift, start one
  const newShift = await prisma.shift.create({
    data: {
      workerId: session.userId,
      startTime: new Date(),
    },
  });

  return newShift;
}

export async function stopShift() {
  const session = await getSession();
  if (!session || session.role !== "WORKER") {
    redirect("/login");
  }

  const activeShift = await prisma.shift.findFirst({
    where: {
      workerId: session.userId,
      endTime: null,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  if (activeShift) {
    const now = new Date();
    const elapsed = now.getTime() - activeShift.startTime.getTime();
    let endTime = now;

    if (elapsed > MAX_SHIFT_DURATION_MS) {
      endTime = new Date(activeShift.startTime.getTime() + MAX_SHIFT_DURATION_MS);
    }

    await prisma.shift.update({
      where: { id: activeShift.id },
      data: { endTime },
    });

    redirect(`/tracker/summary?shiftId=${activeShift.id}`);
  }

  redirect("/tracker/summary");
}
