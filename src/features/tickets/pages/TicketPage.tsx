import React from "react";
import { TicketList } from "../components/TicketList";
import TicketForm from "../components/TicketForm";
import { Modal } from "@mui/material";

const TicketPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const openForm = () => setIsFormOpen(true);
  return (
    <div>
      <TicketList onCreateClick={openForm} />
      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <TicketForm />
      </Modal>
    </div>
  );
};

export default TicketPage;
