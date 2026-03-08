import { useBooking } from "@/hooks/useBooking";
import { ROOMS, type RoomCode } from "@/config/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";

export function RoomSelect() {
  const { state, setRoom, setRoomReason, setStep } = useBooking();

  const handleContinue = () => {
    if (!state.room || !state.roomReason.trim()) return;
    const nextStep = state.route === "C" ? 2 : 3;
    setStep(nextStep);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep(0)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Select a Room</h2>
          <p className="text-muted-foreground">Choose the lab you'd like to use</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {ROOMS.map((room, i) => (
          <motion.div
            key={room.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex"
          >
            <Card
              className={`cursor-pointer transition-all w-full flex ${
                state.room === room.code
                  ? "border-primary ring-2 ring-primary shadow-md"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setRoom(room.code as RoomCode)}
            >
              <CardContent className="flex items-center gap-3 p-4 w-full">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    state.room === room.code
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <FlaskConical className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm">{room.name}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {state.room && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <label className="text-sm font-medium">
            Reason / Requirements for use
          </label>
          <Textarea
            value={state.roomReason}
            onChange={e => setRoomReason(e.target.value)}
            placeholder="e.g., Biology class experiment on cell division for Grade 10..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleContinue}
              disabled={!state.roomReason.trim()}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
