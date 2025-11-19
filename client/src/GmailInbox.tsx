import React, { useEffect, useState } from 'react';
import {
	Search,
	Mail,
	RefreshCw,
	Sun,
	Moon,
	X,
	ChevronLeft,
	Inbox,
	Star,
	Clock,
} from 'lucide-react';
import axios from 'axios';

// Configure axios
const api = axios.create({
	baseURL: 'http://localhost:3000',
	withCredentials: true,
	timeout: 10000,
});

type EmailSummary = {
	id: string;
	subject?: string;
	from?: string;
	date?: string;
	snippet?: string;
	unread?: boolean;
};

type EmailDetail = EmailSummary & {
	body?: string;
	htmlBody?: string;
};

export default function GmailInbox(): JSX.Element {
	const [emails, setEmails] = useState<EmailSummary[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState<string | null>(null);
	const [detail, setDetail] = useState<EmailDetail | null>(null);
	const [detailLoading, setDetailLoading] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [dark, setDark] = useState<boolean>(false);

	useEffect(() => {
		let mounted = true;
		const ctrl = new AbortController();

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch('http://localhost:3000/api/emails', {
					signal: ctrl.signal,
					credentials: 'include',
				});
				if (res.status === 401) {
					window.location.href = '/auth/google';
					return;
				}
				if (!res.ok) throw new Error(`Server error: ${res.status}`);
				const data = (await res.json()) as EmailSummary[];
				if (!mounted) return;
				setEmails(data || []);
			} catch (err: any) {
				if (err.name === 'AbortError') return;
				setError(err.message || 'Failed to load emails');
			} finally {
				if (mounted) setLoading(false);
			}
		}

		load();
		return () => {
			mounted = false;
			ctrl.abort();
		};
	}, []);

	useEffect(() => {
		if (!selected) {
			setDetail(null);
			return;
		}
		let mounted = true;
		const ctrl = new AbortController();

		(async function fetchDetail() {
			setDetailLoading(true);
			setDetail(null);
			try {
				const res = await fetch(
					`http://localhost:3000/api/emails/${selected}`,
					{
						signal: ctrl.signal,
						credentials: 'include',
					}
				);
				if (!res.ok) throw new Error(`Failed to fetch message ${res.status}`);
				const data = (await res.json()) as EmailDetail;
				if (!mounted) return;
				setDetail(data);
			} catch (err: any) {
				if (err.name === 'AbortError') return;
				setError(err.message || 'Failed to load message');
			} finally {
				if (mounted) setDetailLoading(false);
			}
		})();

		return () => {
			mounted = false;
			ctrl.abort();
		};
	}, [selected]);

	const filteredEmails = emails.filter(
		(e) =>
			searchQuery === '' ||
			e.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			e.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			e.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	function formatDate(dateStr?: string) {
		if (!dateStr) return '';
		try {
			const d = new Date(dateStr);
			const now = new Date();
			const diff = now.getTime() - d.getTime();
			const hours = diff / (1000 * 60 * 60);

			if (hours < 24) {
				return d.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
				});
			} else if (hours < 48) {
				return 'Yesterday';
			} else if (hours < 168) {
				return d.toLocaleDateString('en-US', { weekday: 'short' });
			} else {
				return d.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
				});
			}
		} catch (e) {
			return dateStr || '';
		}
	}

	function getInitials(email?: string) {
		if (!email) return '?';
		const match = email.match(/\b(\w)/g);
		return match ? match.slice(0, 2).join('').toUpperCase() : '?';
	}

	return (
		<div
			className={`min-h-screen transition-colors duration-200 ${
				dark ? 'bg-gray-950' : 'bg-gray-50'
			}`}>
			{/* Header */}
			<header
				className={`sticky top-0 z-10 border-b backdrop-blur-sm ${
					dark
						? 'bg-gray-900/80 border-gray-800'
						: 'bg-white/80 border-gray-200'
				}`}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center gap-3">
							<div
								className={`p-2 rounded-lg ${
									dark ? 'bg-blue-600' : 'bg-blue-600'
								}`}>
								<Mail className="w-5 h-5 text-white" />
							</div>
							<h1
								className={`text-xl font-semibold ${
									dark ? 'text-white' : 'text-gray-900'
								}`}>
								Inbox
							</h1>
							<span
								className={`text-sm ${
									dark ? 'text-gray-400' : 'text-gray-500'
								}`}>
								{filteredEmails.length} messages
							</span>
						</div>

						<div className="flex items-center gap-2">
							<button
								onClick={() => window.location.reload()}
								className={`p-2 rounded-lg transition-colors ${
									dark
										? 'hover:bg-gray-800 text-gray-300'
										: 'hover:bg-gray-100 text-gray-600'
								}`}
								aria-label="Refresh">
								<RefreshCw className="w-5 h-5" />
							</button>
							<button
								onClick={() => setDark(!dark)}
								className={`p-2 rounded-lg transition-colors ${
									dark
										? 'hover:bg-gray-800 text-gray-300'
										: 'hover:bg-gray-100 text-gray-600'
								}`}
								aria-label="Toggle theme">
								{dark ? (
									<Sun className="w-5 h-5" />
								) : (
									<Moon className="w-5 h-5" />
								)}
							</button>
							<a
								href="/logout"
								className="ml-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
								Logout
							</a>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="flex gap-6">
					{/* Sidebar */}
					<aside className="w-64 flex-shrink-0 hidden lg:block">
						<div className="space-y-1">
							<button
								className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
									dark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
								}`}>
								<Inbox className="w-5 h-5" />
								All Mail
							</button>
							<button
								className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
									dark
										? 'text-gray-300 hover:bg-gray-800'
										: 'text-gray-700 hover:bg-gray-100'
								}`}>
								<Star className="w-5 h-5" />
								Starred
							</button>
							<button
								className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
									dark
										? 'text-gray-300 hover:bg-gray-800'
										: 'text-gray-700 hover:bg-gray-100'
								}`}>
								<Clock className="w-5 h-5" />
								Snoozed
							</button>
						</div>

						<div
							className={`mt-6 p-4 rounded-lg text-xs ${
								dark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'
							}`}>
							<p className="font-medium mb-2">API Configuration:</p>
							<ul className="space-y-1 list-disc list-inside">
								<li>Base: localhost:3000</li>
								<li>GET /api/emails</li>
								<li>GET /api/emails/:id</li>
								<li>Credentials: include</li>
							</ul>
						</div>
					</aside>

					{/* Main Content */}
					<main className="flex-1 min-w-0">
						{/* Search Bar */}
						<div className="mb-4">
							<div className="relative">
								<Search
									className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
										dark ? 'text-gray-500' : 'text-gray-400'
									}`}
								/>
								<input
									type="text"
									placeholder="Search emails..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${
										dark
											? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-blue-600'
											: 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-600'
									} focus:outline-none focus:ring-2 focus:ring-blue-600/20`}
								/>
							</div>
						</div>

						{/* Email List */}
						<div
							className={`rounded-lg border overflow-hidden ${
								dark
									? 'bg-gray-900 border-gray-800'
									: 'bg-white border-gray-200'
							}`}>
							{loading && (
								<div className="flex items-center justify-center py-16">
									<div className="flex items-center gap-3">
										<RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
										<span className={dark ? 'text-gray-400' : 'text-gray-600'}>
											Loading emails...
										</span>
									</div>
								</div>
							)}

							{error && (
								<div className="p-6 text-center">
									<div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 text-red-600">
										<X className="w-4 h-4" />
										{error}
									</div>
								</div>
							)}

							{!loading && filteredEmails.length === 0 && !error && (
								<div className="flex flex-col items-center justify-center py-16">
									<Mail
										className={`w-16 h-16 mb-4 ${
											dark ? 'text-gray-700' : 'text-gray-300'
										}`}
									/>
									<p
										className={`text-lg font-medium ${
											dark ? 'text-gray-400' : 'text-gray-600'
										}`}>
										{searchQuery ? 'No emails found' : 'Inbox is empty'}
									</p>
									<p
										className={`text-sm mt-1 ${
											dark ? 'text-gray-500' : 'text-gray-400'
										}`}>
										{searchQuery
											? 'Try a different search term'
											: 'All caught up!'}
									</p>
								</div>
							)}

							<div className="divide-y divide-gray-800">
								{filteredEmails.map((email) => (
									<button
										key={email.id}
										onClick={() => setSelected(email.id)}
										className={`w-full text-left px-4 py-4 transition-colors flex items-start gap-4 ${
											selected === email.id
												? dark
													? 'bg-gray-800'
													: 'bg-blue-50'
												: dark
												? 'hover:bg-gray-800/50'
												: 'hover:bg-gray-50'
										}`}>
										<div
											className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm ${
												dark
													? 'bg-blue-600 text-white'
													: 'bg-blue-100 text-blue-700'
											}`}>
											{getInitials(email.from)}
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-4 mb-1">
												<div className="flex-1 min-w-0">
													<div
														className={`flex items-center gap-2 ${
															email.unread ? 'font-semibold' : 'font-medium'
														}`}>
														<span
															className={`truncate ${
																dark ? 'text-white' : 'text-gray-900'
															}`}>
															{email.from?.split('<')[0].trim() ||
																email.from ||
																'Unknown'}
														</span>
														{email.unread && (
															<span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
														)}
													</div>
												</div>
												<span
													className={`text-xs flex-shrink-0 ${
														dark ? 'text-gray-500' : 'text-gray-500'
													}`}>
													{formatDate(email.date)}
												</span>
											</div>

											<div
												className={`text-sm mb-1 truncate ${
													email.unread ? 'font-medium' : ''
												} ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
												{email.subject || '(no subject)'}
											</div>

											<div
												className={`text-sm truncate ${
													dark ? 'text-gray-500' : 'text-gray-500'
												}`}>
												{email.snippet}
											</div>
										</div>
									</button>
								))}
							</div>
						</div>
					</main>

					{/* Detail Panel */}
					{selected && (
						<aside
							className={`w-96 flex-shrink-0 rounded-lg border overflow-hidden ${
								dark
									? 'bg-gray-900 border-gray-800'
									: 'bg-white border-gray-200'
							}`}>
							<div
								className={`p-4 border-b flex items-center justify-between ${
									dark ? 'border-gray-800' : 'border-gray-200'
								}`}>
								<h3
									className={`font-semibold ${
										dark ? 'text-white' : 'text-gray-900'
									}`}>
									Email Details
								</h3>
								<button
									onClick={() => setSelected(null)}
									className={`p-1 rounded transition-colors ${
										dark
											? 'hover:bg-gray-800 text-gray-400'
											: 'hover:bg-gray-100 text-gray-500'
									}`}>
									<X className="w-5 h-5" />
								</button>
							</div>

							<div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
								{detailLoading && (
									<div className="flex items-center justify-center py-8">
										<RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
									</div>
								)}

								{detail && !detailLoading && (
									<div className="space-y-4">
										<div>
											<label
												className={`text-xs font-medium mb-1 block ${
													dark ? 'text-gray-400' : 'text-gray-500'
												}`}>
												From
											</label>
											<div
												className={`text-sm ${
													dark ? 'text-gray-200' : 'text-gray-900'
												}`}>
												{detail.from}
											</div>
										</div>

										<div>
											<label
												className={`text-xs font-medium mb-1 block ${
													dark ? 'text-gray-400' : 'text-gray-500'
												}`}>
												Subject
											</label>
											<div
												className={`text-sm font-medium ${
													dark ? 'text-white' : 'text-gray-900'
												}`}>
												{detail.subject || '(no subject)'}
											</div>
										</div>

										<div>
											<label
												className={`text-xs font-medium mb-1 block ${
													dark ? 'text-gray-400' : 'text-gray-500'
												}`}>
												Date
											</label>
											<div
												className={`text-sm ${
													dark ? 'text-gray-200' : 'text-gray-900'
												}`}>
												{new Date(detail.date || '').toLocaleString()}
											</div>
										</div>

										<div
											className={`border-t pt-4 ${
												dark ? 'border-gray-800' : 'border-gray-200'
											}`}>
											<label
												className={`text-xs font-medium mb-2 block ${
													dark ? 'text-gray-400' : 'text-gray-500'
												}`}>
												Preview
											</label>
											<div
												className={`text-sm leading-relaxed ${
													dark ? 'text-gray-300' : 'text-gray-700'
												}`}>
												{detail.snippet ||
													detail.body ||
													'No content available'}
											</div>
										</div>
									</div>
								)}
							</div>
						</aside>
					)}
				</div>
			</div>
		</div>
	);
}
