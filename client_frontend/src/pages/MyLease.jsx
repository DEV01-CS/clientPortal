import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const MyLease = () => {
  const [openSection1, setOpenSection1] = useState(false);  
  const [openSection2, setOpenSection2] = useState(false);
  const [openSection3, setOpenSection3] = useState(false);
  const [openSection4, setOpenSection4] = useState(false);
  const [openSection5, setOpenSection5] = useState(false);
  
  return (
    <div className="bg-gray-100 min-h-screen p-6 font-inter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Lease</h1>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full text-sm cursor-pointer">
          Wandsworth, SW18 <span>▼</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="bg-gray-200 rounded-lg p-4 space-y-2">
          <Accordion
            title="Property Demise"
            isOpen={openSection1 === true}
            onClick={() => setOpenSection1(openSection1 === true ? false : true)}
          />

          <Accordion
            title="Service Charge Recoverable"
            active
            isOpen={openSection2 === true}
            onClick={() => setOpenSection2(openSection2 === true ? false : true)}
          >
            <LeaseText />
          </Accordion>

          <Accordion
            title="Health & Safety Recoverable"
            isOpen={openSection3 === true}
            onClick={() => setOpenSection3(openSection3 === true ? false : true)}
          />

          <Accordion
            title="Non-Recoverables"
            isOpen={openSection4 === true}
            onClick={() => setOpenSection4(openSection4 === true ? false : true)}
          />

          <Accordion
            title="Sweeper Clauses"
            isOpen={openSection5 === true}
            onClick={() => setOpenSection5(openSection5 === true ? false : true)}
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white rounded-lg p-6 shadow-sm overflow-y-auto h-[75vh]">
          <h2 className="text-center text-sm font-semibold mb-6">
            Schedule 7 Services and Service Costs
          </h2>

          <div className="text-sm leading-relaxed text-gray-800 space-y-4">
            <p className="font-semibold text-center">Part 1. The Services</p>

            <p className="font-semibold">1. SERVICES</p>

            <ol className="list-decimal ml-5 space-y-2">
              <li>
                cleaning, maintaining, decorating, repairing and replacing the
                Retained Parts and remedying inherent defect;
              </li>
              <li>
                providing heating to the internal areas of the Common Parts
                during such periods of the year as the Landlord or the Management
                Company reasonably considers appropriate, and cleaning,
                maintaining, repairing and replacing the heating machinery and
                equipment;
              </li>
              <li>
                lighting the Common Parts and the Parking Spaces and cleaning,
                maintaining, repairing and replacing lighting, machinery and
                equipment on the Common Parts;
              </li>
              <li>
                cleaning, maintaining, repairing and replacing the furniture,
                fittings and equipment in the Common Parts;
              </li>
              <li>
                cleaning, maintaining, repairing and replacing the lifts and
                lift machinery and equipment on the Common Parts;
              </li>
              <li>
                cleaning, maintaining, repairing, operating and replacing
                security machinery and equipment (including closed circuit
                television) on the Common Parts;
              </li>
              <li>
                cleaning, maintaining, repairing, operating and replacing fire
                prevention, detection and fighting machinery and equipment and
                fire alarms on the Common Parts;
              </li>
              <li>
                cleaning, maintaining, repairing and replacing refuse bins on
                the Common Parts;
              </li>
              <li>
                cleaning the outside of the windows of the Building;
              </li>
              <li>
                cleaning, maintaining, repairing and replacing signage for the
                Common Parts;
              </li>
              <li>
                maintaining any landscaped and grassed areas of the Common
                Parts;
              </li>
              <li>
                cleaning, maintaining, repairing and replacing the floor
                coverings on the internal areas of the Common Parts; and
              </li>
              <li>
                any other service or amenity that the Landlord or the Management
                Company may in their reasonable discretion provide for the
                benefit of the tenants and occupiers of the Building.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- COMPONENTS ---------------- */

const Accordion = ({ title, children, isOpen, onClick, active }) => (
  <div className="bg-gray-100 rounded-lg">
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg
        ${
          active
            ? "text-sidebar"
            : "text-gray-900"
        }`}
    >
      {title}
      {isOpen ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>

    {isOpen && children && (
      <div className="px-4 pb-4">{children}</div>
    )}
  </div>
);

const LeaseText = () => (
  <div className="text-sm text-gray-700 space-y-4">
    <div>
      <p className="font-semibold">Staff</p>
      <p className="italic text-xs mb-1">
        Seventh Schedule Paragraph 13
      </p>
      <p>
        “To employ or engage persons in connection with the provision of the
        Services or the Landlord’s other obligations under this Lease…”
      </p>
    </div>

    <div>
      <p className="font-semibold">Contracts & Maintenance</p>
      <p className="italic text-xs mb-1">
        Seventh Schedule, Paragraph 1
      </p>
      <p>
        “To inspect the front doors of the flats in the Building and the fire
        alarm systems in those flats to make sure that they are operational and
        comply with the fire strategy for the Building.”
      </p>
    </div>

    <div>
      <p className="font-semibold">Utilities</p>
      <p className="italic text-xs mb-1">
        Seventh Schedule, Paragraph 14(a)
      </p>
      <p>
        “To provide electricity, water, gas, telephone, telecommunications and
        other supplies to the Common Parts and comply with lawful
        requirements…”
      </p>
    </div>
  </div>
);

export default MyLease;
