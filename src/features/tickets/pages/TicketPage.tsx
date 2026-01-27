import React from "react";
import { TicketList } from "../components/TicketList";
import TicketForm from "../components/TicketForm";
import { Modal } from "@mui/material";
import { Ticket } from "@nulltasker/shared-types";

const TicketPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = React.useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = React.useState(0);

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);

  const handleSave = () => {
    closeForm();
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    openForm();
  };

  return (
    <div>
      <TicketList
        key={refreshKey}
        onCreateClick={openForm}
        onEditClick={handleEdit}
      />
      <Modal open={isFormOpen} onClose={closeForm}>
        <TicketForm
          ticket={selectedTicket}
          onSave={handleSave}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
};

export default TicketPage;
