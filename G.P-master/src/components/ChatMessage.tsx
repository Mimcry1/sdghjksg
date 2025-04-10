import React from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  content: string;
}

function renderContent(content: string) {
  // Basic Markdown parsing (very limited)
  let output = content;

  // Headings: ### text
  output = output.replace(/###\s(.*?)(?=\n|$)/g, '<h3>$1</h3>');
  output = output.replace(/##\s(.*?)(?=\n|$)/g, '<h2>$1</h2>');
  output = output.replace(/#\s(.*?)(?=\n|$)/g, '<h1>$1</h1>');

  // Bold: **text**
  output = output.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italics: *text*
  output = output.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Bullet points: • text
  output = output.replace(/•\s(.*?)(?=\n|$)/g, '<li>• $1</li>');
  output = output.replace(/<li>•/g, '<ul><li>•');
  output = output.replace(/<\/li>(?!<\/ul>)/g, '</li></ul>');

  // Numbered lists: 1. text
  output = output.replace(/(\d+)\.\s(.*?)(?=(\n\d+\.|$))/g, '<li>$1. $2</li>');
  output = output.replace(/<li>(\d+)\./g, '<ol><li>$1.');
  output = output.replace(/<\/li>(?!<\/ol>)/g, '</li></ol>');

  // Convert nested numbered lists to bullet points
  output = output.replace(/<ol><li>\d+\.\s*<ol>/g, '<ul><li>');
  output = output.replace(/<\/ol><\/li><\/ul>/g, '</li></ul>');

  // Preserve line breaks: \n -> <br />
  output = output.replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: output }} />;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-content">{renderContent(message.content)}</div>
    </div>
  );
}
