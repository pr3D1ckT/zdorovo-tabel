"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function registerWorker(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "Немає доступу" };

  const login = formData.get("login")?.toString();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString();

  if (!login || !password || !name) {
    return { error: "Заповніть усі поля" };
  }

  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) {
    return { error: "Логін вже зайнятий" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const qrToken = crypto.randomUUID();

  await prisma.user.create({
    data: {
      login,
      password: hashedPassword,
      name,
      role: "WORKER",
      qrToken,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function generateQrToken(userId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Немає доступу");

  const qrToken = crypto.randomUUID();
  
  await prisma.user.update({
    where: { id: userId },
    data: { qrToken }
  });
  
  revalidatePath("/admin");
  return qrToken;
}

export async function deleteWorker(userId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Немає доступу");

  await prisma.$transaction([
    prisma.shift.deleteMany({ where: { workerId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/admin");
  return { success: true };
}

export async function updateHourlyRate(userId: string, rate: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Немає доступу");

  await prisma.user.update({
    where: { id: userId },
    data: { hourlyRate: rate }
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateShift(shiftId: string, startIso: string, endIso: string | null) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Немає доступу");

  await prisma.shift.update({
    where: { id: shiftId },
    data: { 
      startTime: new Date(startIso),
      endTime: endIso ? new Date(endIso) : null
    }
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function createShift(workerId: string, startIso: string, endIso: string | null) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Немає доступу");

  await prisma.shift.create({
    data: {
      workerId,
      startTime: new Date(startIso),
      endTime: endIso ? new Date(endIso) : null
    }
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteShift(shiftId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Немає доступу");

  await prisma.shift.delete({
    where: { id: shiftId }
  });

  revalidatePath("/admin");
  return { success: true };
}
