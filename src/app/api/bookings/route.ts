
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const bookingDetails = await request.json();

  // Simulate a successful booking
  console.log("Booking received:", bookingDetails);

  // In a real application, you would save this to a database,
  // check availability, send notifications, etc.

  return NextResponse.json(
    { message: "Réservation effectuée avec succès !", bookingDetails },
    { status: 201 }
  );
}
