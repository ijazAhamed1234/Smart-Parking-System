import { useEffect, useRef } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { useParkingZones, useSlotDetection } from "../hooks/useFirebaseData";

export function useBookingManager() {
  const { data: parkingZones } = useParkingZones();
  const { sensorDetection, cvDetection } = useSlotDetection();
  const releasingSlots = useRef(new Set());

  useEffect(() => {
    const checkExpiry = async () => {
      if (!parkingZones || !Array.isArray(parkingZones)) return;
      
      const now = Date.now();
      
      parkingZones.forEach((zone, zIndex) => {
        if (!zone || !zone.spots) return;
        const zoneId = zone.id;
        
        zone.spots.forEach((spot, sIndex) => {
          // 1. Only monitor reserved slots
          if (!spot || spot.rawStatus !== "reserved") return;
          
          // 2. Ignore if currently being released
          if (releasingSlots.current.has(spot.id)) return;

          // 3. Check detection status (sIndex 0 is the hardware-linked slot)
          const isLiveSlot = sIndex === 0;
          const hasCar = isLiveSlot ? (!!sensorDetection[zoneId]?.detected && !!cvDetection[zoneId]?.detected) : false;

          // DEBUG LOGGING
          // console.log(`Checking Slot ${spot.id}: hasCar=${hasCar}, carArrived=${spot.carArrived}`);

          // CASE A: Car just arrived at reserved slot
          if (hasCar && !spot.carArrived) {
            console.log(`[useBookingManager] Car ARRIVED at ${spot.id}. Updating Firebase...`);
            update(ref(db), { [`parkingZones/${zIndex}/spots/${sIndex}/carArrived`]: true });
          }

          // CASE B: Car just departed (Departure Detection)
          else if (!hasCar && spot.carArrived) {
            console.log(`[useBookingManager] Car DEPARTED from ${spot.id}. Triggering release...`);
            releaseSlot(spot, zIndex, sIndex, true);
          }

          // CASE C: Time expired but car never arrived
          else if (!hasCar && !spot.carArrived && spot.expiryTime && now > spot.expiryTime) {
            console.log(`[useBookingManager] Time EXPIRED for ${spot.id} (No show). Releasing...`);
            releaseSlot(spot, zIndex, sIndex, false);
          }
        });
      });
    };

    const releaseSlot = async (spot, zIndex, sIndex, sendBill) => {
      if (releasingSlots.current.has(spot.id)) return;
      releasingSlots.current.add(spot.id);

      console.log(`[useBookingManager] Releasing slot ${spot.id}...`);

      const updates = {};
      updates[`parkingZones/${zIndex}/spots/${sIndex}/status`] = "available";
      updates[`parkingZones/${zIndex}/spots/${sIndex}/carArrived`] = false;
      updates[`parkingZones/${zIndex}/spots/${sIndex}/ownerName`] = null;
      updates[`parkingZones/${zIndex}/spots/${sIndex}/mobileNo`] = null;
      updates[`parkingZones/${zIndex}/spots/${sIndex}/expiryTime`] = null;

      try {
        await update(ref(db), updates);
        console.log(`[useBookingManager] Slot ${spot.id} successfully released in Firebase.`);
        
        if (sendBill && spot.mobileNo) {
          const variables = {
            "1": spot.id,
            "2": `Departure Bill: ₹${spot.totalPrice || 20}`
          };
          console.log(`[useBookingManager] Sending Twilio bill to ${spot.mobileNo}...`);
          sendWhatsAppTemplate(spot.mobileNo, variables);
        }
      } catch (err) {
        console.error(`[useBookingManager] Failed to release slot ${spot.id}:`, err);
      } finally {
        // Clear the lock after a delay to allow future bookings
        setTimeout(() => {
          releasingSlots.current.delete(spot.id);
        }, 5000);
      }
    };

    const interval = setInterval(checkExpiry, 3000);
    return () => clearInterval(interval);
  }, [parkingZones, sensorDetection, cvDetection]);
}

export const sendWhatsAppTemplate = async (phone, variables) => {
  if (!phone) return;
  try {
    const response = await fetch("http://localhost:5000/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, variables }),
    });

    if (response.ok) {
      console.log("[Twilio] Template notification sent.");
    } else {
      console.error("[Twilio] Server error:", await response.text());
    }
  } catch (error) {
    console.error("[Twilio] Network error (is server.js running?):", error);
  }
};
