// src/App.tsx
import React from 'react';
import GmailInbox from './GmailInbox'; // path to the component you already made
import './index.css'; // ensure Tailwind is loaded

export default function App(): JSX.Element {
	return (
		<div>
			<GmailInbox />
		</div>
	);
}
