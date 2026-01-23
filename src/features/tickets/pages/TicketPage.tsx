import React from "react";
import { TicketList } from "../components/TicketList";
import TicketForm from "../components/TicketForm";
import { Modal } from "@mui/material";

const TicketPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);

  const handleSave = () => {
    closeForm();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <TicketList key={refreshKey} onCreateClick={openForm} />
      <Modal open={isFormOpen} onClose={closeForm}>
        <TicketForm onSave={handleSave} onCancel={closeForm} />
      </Modal>
    </div>
  );
};

export default TicketPage;
