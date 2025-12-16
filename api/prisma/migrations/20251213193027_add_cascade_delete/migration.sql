-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "research_requests" DROP CONSTRAINT "research_requests_message_id_fkey";

-- DropForeignKey
ALTER TABLE "research_results" DROP CONSTRAINT "research_results_research_request_id_fkey";

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_requests" ADD CONSTRAINT "research_requests_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_results" ADD CONSTRAINT "research_results_research_request_id_fkey" FOREIGN KEY ("research_request_id") REFERENCES "research_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
