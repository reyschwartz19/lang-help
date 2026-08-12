'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Mic2, Play, RotateCcw, Volume2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell, ScreenCard, ScreenHeading } from '@/components/app-shell'
import { db, type SpeakingSession } from '@/data/db'
import { playAudio } from '@/lib/audio'

const scenarios = [
  {
    id: 'greeting',
    prompt: 'Bonjour, comment allez-vous ?',
    translation: 'Hello, how are you?',
    context: 'You are meeting someone for the first time in a café.',
  },
  {
    id: 'coffee',
    prompt: 'Je voudrais un café, s’il vous plaît.',
    translation: 'I would like a coffee, please.',
    context: 'You are ordering at a bakery counter.',
  },
  {
    id: 'weekend',
    prompt: 'Qu’est-ce que vous faites ce week-end ?',
    translation: 'What are you doing this weekend?',
    context: 'You are chatting with a new friend.',
  },
  {
    id: 'apology',
    prompt: 'Je suis désolé, je ne comprends pas.',
    translation: 'I am sorry, I do not understand.',
    context: 'You missed part of a conversation and need to ask for clarification.',
  },
  {
    id: 'opinion',
    prompt: 'Je pense que c’est vraiment intéressant.',
    translation: 'I think that is really interesting.',
    context: 'You are sharing your opinion in a casual conversation.',
  },
] as const

const ratingOptions = [
  { key: 'great', label: 'Great' },
  { key: 'good', label: 'Good' },
  { key: 'needs-work', label: 'Needs work' },
] as const

type RatingKey = (typeof ratingOptions)[number]['key']

export default function SpeakingPage() {
  const [index, setIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [selectedRating, setSelectedRating] = useState<RatingKey | null>(null)
  const [status, setStatus] = useState('Tap record when you are ready.')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunkRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  const currentScenario = scenarios[index]
  const recentSessions =
    useLiveQuery(
      () => db.speakingSessions.orderBy('completedAt').reverse().limit(5).toArray(),
      [],
    ) ?? []

  useEffect(() => {
    if (!recording) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    setElapsedSeconds(0)
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1)
    }, 1000)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [recording])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
    }
  }, [recordingUrl])

  const clearRecording = () => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl)
    }
    setRecordingUrl(null)
    setRecordingBlob(null)
    setSelectedRating(null)
  }

  const startRecording = async () => {
    if (typeof navigator === 'undefined' || !('mediaDevices' in navigator) || typeof window.MediaRecorder === 'undefined') {
      setStatus('This browser does not support microphone recording.')
      return
    }

    clearRecording()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunkRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunkRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunkRef.current, { type: 'audio/webm' })
        const blobUrl = URL.createObjectURL(blob)

        if (recordingUrl) {
          URL.revokeObjectURL(recordingUrl)
        }

        setRecordingBlob(blob)
        setRecordingUrl(blobUrl)
        setStatus('Listen back and rate yourself before moving on.')

        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorder.start()
      setRecording(true)
      setStatus('Recording… speak naturally and keep your pace steady.')
    } catch {
      setStatus('Microphone permission is required to record your practice.')
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current

    if (!recorder || recorder.state === 'inactive') {
      return
    }

    recorder.stop()
    setRecording(false)
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const saveSession = async () => {
    if (!recordingBlob) {
      return
    }

    const session: SpeakingSession = {
      id: crypto.randomUUID(),
      scenarioId: currentScenario.id,
      promptText: currentScenario.prompt,
      recordingBlob: recordingBlob,
      selfRating: selectedRating ?? undefined,
      completedAt: new Date(),
    }

    await db.speakingSessions.put(session)
    clearRecording()
    setStatus('Saved to your session log.')
    setIndex((value) => (value + 1) % scenarios.length)
  }

  const handleNextPrompt = () => {
    setStatus('Ready when you are.')
    setIndex((value) => (value + 1) % scenarios.length)
  }

  const playLoggedSession = (session: SpeakingSession) => {
    const url = URL.createObjectURL(session.recordingBlob)
    const audio = new Audio(url)
    audio.play()
    audio.onended = () => URL.revokeObjectURL(url)
  }

  return (
    <AppShell title="Speaking practice">
      <div className="screen-stack">
        <ScreenCard className="speaking-card">
          <div className="review-progress">
            <span>
              Prompt {index + 1} of {scenarios.length}
            </span>
            <span>{recording ? `${elapsedSeconds}s` : '3 min'}</span>
          </div>

          <div className="prompt-card">
            <p className="eyebrow">SAY THIS OUT LOUD</p>
            <h2>{currentScenario.prompt}</h2>
            <button
              className="sound-button"
              aria-label="Listen to prompt"
              onClick={() => playAudio(currentScenario.prompt, 0.8)}
            >
              <Volume2 size={20} />
            </button>
            <p className="prompt-translation">{currentScenario.translation}</p>
            <p className="mt-3 text-xs text-slate-500">{currentScenario.context}</p>
          </div>

          {recordingUrl && (
            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="eyebrow">LISTEN BACK</span>
                <span className="text-[11px] font-bold text-slate-500">Your take</span>
              </div>
              <audio controls src={recordingUrl} className="w-full" />
            </div>
          )}

          {!recording ? (
            <button className="record-button" onClick={startRecording}>
              <Mic2 size={25} />
              {recordingUrl ? 'Record again' : 'Tap to record'}
            </button>
          ) : (
            <button className="record-button recording" onClick={stopRecording}>
              <Mic2 size={25} />
              Stop recording
            </button>
          )}

          {recordingUrl && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {ratingOptions.map(({ key, label }) => (
                <button
                  key={key}
                  className={`pill-button ${selectedRating === key ? 'primary-pill' : ''}`}
                  onClick={() => setSelectedRating(key)}
                >
                  {selectedRating === key && <Check size={14} />}
                  {label}
                </button>
              ))}
            </div>
          )}

          <button
            className="secondary-button full mt-4"
            onClick={recordingBlob ? saveSession : handleNextPrompt}
          >
            {recordingBlob ? 'Save and next prompt' : 'I’m ready for the next one'}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">{status}</p>
        </ScreenCard>

        <ScreenHeading eyebrow="SESSION LOG" title="Recent takes" />

        {recentSessions.length === 0 ? (
          <p className="screen-copy">No speaking sessions yet. Record your first take to begin your log.</p>
        ) : (
          <div className="vocab-list">
            {recentSessions.map((session) => (
              <div key={session.id} className="phrase-row mint">
                <div>
                  <strong>{session.promptText}</strong>
                  <span>
                    {new Date(session.completedAt).toLocaleDateString()} ·{' '}
                    {session.selfRating ? ratingOptions.find((option) => option.key === session.selfRating)?.label : 'Unrated'}
                  </span>
                </div>
                <div className="phrase-row-actions">
                  <button aria-label="Play session recording" onClick={() => playLoggedSession(session)}>
                    <Play size={14} />
                  </button>
                  <button aria-label="Replay reference prompt" onClick={() => playAudio(session.promptText, 0.8)}>
                    <Volume2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <ScreenHeading eyebrow="TIPS" title="Speak with confidence" />
        <p className="screen-copy">
          Listen first, then repeat at your own pace. There is no perfect accent—just keep practicing.
        </p>
      </div>
    </AppShell>
  )
}
