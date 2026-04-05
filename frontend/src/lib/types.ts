export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  email: string;
  companyId: string;
  role: 'ADMIN' | 'EMPLOYEE';
  personaTone: string;
  createdAt: string;
}

export interface Document {
  id: string;
  companyId: string;
  filename: string;
  fileType: 'PDF' | 'PPTX' | 'DOCX' | 'XLSX';
  filePath: string;
  uploadedById: string;
  chunkCount: number;
  status: 'PROCESSING' | 'READY' | 'ERROR';
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: string[];
  confidence: number | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  employeeId: string;
  messages: Message[];
  createdAt: string;
}
