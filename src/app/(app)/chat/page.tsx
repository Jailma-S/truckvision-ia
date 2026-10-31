import { PageHeader } from "@/components/ui";
import { ChatInterface } from "@/features/chat";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="Chat de Inteligência Comercial"
        description="Respostas baseadas apenas nos dados registrados na plataforma, com referência aos sinais."
      />
      <ChatInterface />
    </>
  );
}
