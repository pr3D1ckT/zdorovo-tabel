"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function login(prevState: any, formData: FormData) {
  const login = formData.get("login")?.toString();
  const password = formData.get("password")?.toString();

  if (!login || !password) {
    return { error: "Заповніть усі поля" };
  }

  let user = await prisma.user.findUnique({
    where: { login },
  });

  // Автоматическое создание первого администратора
  if (!user) {
    const userCount = await prisma.user.count();
    if (userCount === 0 && login === 'admin') {
      const adminPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          login: 'admin',
          password: adminPassword,
          name: 'Адміністратор',
          role: 'ADMIN',
        }
      });
    }
  }

  if (!user) {
    return { error: "Користувача не знайдено" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: "Невірний пароль" };
  }

  await createSession(user.id, user.role, user.name);

  if (user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/tracker");
  }
}

export async function qrLogin(token: string) {
  if (!token) return { error: "Некоректний QR код" };

  const user = await prisma.user.findUnique({
    where: { qrToken: token }
  });

  if (!user) {
    return { error: "Користувача не знайдено або QR код недійсний" };
  }

  await createSession(user.id, user.role, user.name);

  if (user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/tracker");
  }
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
