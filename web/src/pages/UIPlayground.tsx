import { useMemo, useRef, useState } from "react";
import Heading from "@/components/ui/heading";
import useSWR from "swr";
import { FrigateConfig } from "@/types/frigateConfig";
import ActivityIndicator from "@/components/ui/activity-indicator";
import EventReviewTimeline from "@/components/timeline/EventReviewTimeline";
import { ReviewData, ReviewSegment, ReviewSeverity } from "@/types/review";
import { Button } from "@/components/ui/button";

// Color data
const colors = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
];

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center mb-2">
      <div
        className="w-10 h-10 mr-2 border border-gray-300"
        style={{ backgroundColor: value }}
      ></div>
      <span>{name}</span>
    </div>
  );
}

const generateRandomEvent = (): ReviewSegment => {
  const start_time =
    Math.floor(Date.now() / 1000) - 10800 - Math.random() * 60 * 60;
  const end_time = Math.floor(start_time + Math.random() * 60 * 10);
  const severities: ReviewSeverity[] = [
    "significant_motion",
    "detection",
    "alert",
  ];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const has_been_reviewed = Math.random() < 0.2;
  const id = new Date(start_time * 1000).toISOString(); // Date string as mock ID

  // You need to provide values for camera, thumb_path, and data
  const camera = "CameraXYZ";
  const thumb_path = "/path/to/thumb";
  const data: ReviewData = {
    audio: [],
    detections: [],
    objects: [],
    significant_motion_areas: [],
    zones: [],
  };

  return {
    id,
    start_time,
    end_time,
    severity,
    has_been_reviewed,
    camera,
    thumb_path,
    data,
  };
};

function UIPlayground() {
  const { data: config } = useSWR<FrigateConfig>("config");
  const contentRef = useRef<HTMLDivElement>(null);
  const [mockEvents, setMockEvents] = useState<ReviewSegment[]>([]);
  const [handlebarTime, setHandlebarTime] = useState(
    Math.floor(Date.now() / 1000) - 15 * 60,
  );

  useMemo(() => {
    const initialEvents = Array.from({ length: 50 }, generateRandomEvent);
    setMockEvents(initialEvents);
  }, []);

  // Calculate minimap start and end times based on events
  const minimapStartTime = useMemo(() => {
    if (mockEvents && mockEvents.length > 0) {
      return Math.min(...mockEvents.map((event) => event.start_time));
    }
    return Math.floor(Date.now() / 1000); // Default to current time if no events
  }, [mockEvents]);

  const minimapEndTime = useMemo(() => {
    if (mockEvents && mockEvents.length > 0) {
      return Math.max(
        ...mockEvents.map((event) => event.end_time ?? event.start_time),
      );
    }
    return Math.floor(Date.now() / 1000); // Default to current time if no events
  }, [mockEvents]);

  const [zoomLevel, setZoomLevel] = useState(0);
  const [zoomSettings, setZoomSettings] = useState({
    segmentDuration: 60,
    timestampSpread: 15,
  });

  const possibleZoomLevels = [
    { segmentDuration: 60, timestampSpread: 15 },
    { segmentDuration: 30, timestampSpread: 5 },
    { segmentDuration: 10, timestampSpread: 1 },
  ];

  function handleZoomIn() {
    const nextZoomLevel = Math.min(
      possibleZoomLevels.length - 1,
      zoomLevel + 1,
    );
    setZoomLevel(nextZoomLevel);
    setZoomSettings(possibleZoomLevels[nextZoomLevel]);
  }

  function handleZoomOut() {
    const nextZoomLevel = Math.max(0, zoomLevel - 1);
    setZoomLevel(nextZoomLevel);
    setZoomSettings(possibleZoomLevels[nextZoomLevel]);
  }

  const [isDragging, setIsDragging] = useState(false);

  const handleDraggingChange = (dragging: boolean) => {
    setIsDragging(dragging);
  };

  return (
    <>
      <div className="w-full h-full">
        <div className="flex h-full">
          <div className="flex-1 content-start gap-2 overflow-y-auto no-scrollbar mt-4 mr-5">
            <Heading as="h2">UI Playground</Heading>

            <Heading as="h4" className="my-5">
              Scrubber
            </Heading>
            <p className="text-small">
              Shows the 10 most recent events within the last 4 hours
            </p>

            {!config && <ActivityIndicator />}

            <div ref={contentRef}>
              <Heading as="h4" className="my-5">
                Timeline
              </Heading>
              <p className="text-small">
                Handlebar timestamp: {handlebarTime} -&nbsp;
                {new Date(handlebarTime * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  month: "short",
                  day: "2-digit",
                  second: "2-digit",
                })}
              </p>
              <p className="text-small">
                Handlebar is dragging: {isDragging ? "yes" : "no"}
              </p>
              <p>
                <Button onClick={handleZoomOut} disabled={zoomLevel === 0}>
                  Zoom Out
                </Button>
                <Button
                  onClick={handleZoomIn}
                  disabled={zoomLevel === possibleZoomLevels.length - 1}
                >
                  Zoom In
                </Button>
              </p>
              <Heading as="h4" className="my-5">
                Color scheme
              </Heading>
              <p className="text-small">
                Colors as set by the current theme. See the{" "}
                <a
                  className="underline"
                  href="https://ui.shadcn.com/docs/theming"
                >
                  shadcn theming docs
                </a>{" "}
                for usage.
              </p>

              <div className="my-5">
                {colors.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    name={color}
                    value={`hsl(var(--${color}))`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="w-[100px] overflow-y-auto no-scrollbar">
            <EventReviewTimeline
              segmentDuration={zoomSettings.segmentDuration} // seconds per segment
              timestampSpread={zoomSettings.timestampSpread} // minutes between each major timestamp
              timelineStart={Math.floor(Date.now() / 1000)} // timestamp start of the timeline - the earlier time
              timelineEnd={Math.floor(Date.now() / 1000) - 6 * 60 * 60} // end of timeline - the later time
              showHandlebar // show / hide the handlebar
              handlebarTime={handlebarTime} // set the time of the handlebar
              setHandlebarTime={setHandlebarTime} // expose handler to set the handlebar time
              onHandlebarDraggingChange={handleDraggingChange} // function for state of handlebar dragging
              showMinimap // show / hide the minimap
              minimapStartTime={minimapStartTime} // start time of the minimap - the earlier time (eg 1:00pm)
              minimapEndTime={minimapEndTime} // end of the minimap - the later time (eg 3:00pm)
              events={mockEvents} // events, including new has_been_reviewed and severity properties
              severityType={"alert"} // choose the severity type for the middle line - all other severity types are to the right
              contentRef={contentRef} // optional content ref where previews are, can be used for observing/scrolling later
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default UIPlayground;
