import {
  AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, inject, signal, ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-doctor-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
  ],
  template: `
    <div class="chat-shell">
      <header class="chat-header">
        <h1>Clinical Assistant</h1>
        <p>AI-powered support for clinical decisions</p>
      </header>

      <div class="chat-messages" #messagesEl>
        @if (messages().length === 0) {
          <div class="chat-welcome">
            <mat-icon>smart_toy</mat-icon>
            <p>Ask a clinical question to get started.</p>
          </div>
        }
        @for (msg of messages(); track $index) {
          <div class="msg" [class.msg--user]="msg.role === 'user'"
               [class.msg--assistant]="msg.role === 'assistant'">
            <div class="msg__bubble">{{ msg.text }}</div>
          </div>
        }
        @if (loading()) {
          <div class="msg msg--assistant">
            <div class="msg__bubble msg__bubble--loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        }
      </div>

      <form class="chat-input" [formGroup]="form" (ngSubmit)="send()">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="chat-input__field">
          <input matInput formControlName="message"
                 placeholder="Ask a clinical question…"
                 (keydown.enter)="onEnter($event)">
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit"
                [disabled]="loading() || form.invalid">
          <mat-icon>send</mat-icon>
        </button>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100%;
    }

    .chat-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      background: var(--color-surface-2);
    }

    .chat-header {
      padding: 20px 32px 16px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface);
      flex-shrink: 0;

      h1 {
        font-size: 20px;
        font-weight: 600;
        color: var(--color-text-1);
        letter-spacing: -.02em;
      }

      p {
        font-size: 13px;
        color: var(--color-text-2);
        margin-top: 2px;
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin: auto;
      color: var(--color-text-3);

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }

      p { font-size: 14px; }
    }

    .msg {
      display: flex;

      &--user {
        justify-content: flex-end;

        .msg__bubble {
          background: var(--color-primary);
          color: white;
          border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg);
        }
      }

      &--assistant {
        justify-content: flex-start;

        .msg__bubble {
          background: var(--color-surface);
          color: var(--color-text-1);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg);
        }
      }

      &__bubble {
        max-width: 72%;
        padding: 10px 14px;
        font-size: 14px;
        line-height: 1.5;
        box-shadow: var(--shadow-card);

        &--loading {
          display: flex;
          gap: 4px;
          padding: 14px 18px;

          span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--color-text-3);
            animation: pulse 1.2s infinite;

            &:nth-child(2) { animation-delay: .2s; }
            &:nth-child(3) { animation-delay: .4s; }
          }
        }
      }
    }

    @keyframes pulse {
      0%, 80%, 100% { transform: scale(1); opacity: .6; }
      40%            { transform: scale(1.3); opacity: 1; }
    }

    .chat-input {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      flex-shrink: 0;

      &__field {
        flex: 1;
      }

      button {
        height: 48px;
        min-width: 48px;
        padding: 0 16px;
      }
    }
  `],
})
export class DoctorChatComponent implements AfterViewChecked {
  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;

  private readonly chatSvc = inject(ChatService);
  private readonly auth    = inject(AuthService);
  private readonly fb      = inject(FormBuilder);
  private readonly cdr     = inject(ChangeDetectorRef);

  readonly messages = signal<Message[]>([]);
  readonly loading  = signal(false);

  readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.send();
  }

  send(): void {
    if (this.form.invalid || this.loading()) return;

    const text = this.form.getRawValue().message.trim();
    if (!text) return;

    this.messages.update(msgs => [...msgs, { role: 'user', text }]);
    this.form.reset();
    this.loading.set(true);

    this.chatSvc.send({
      message:  text,
      doctorId: this.auth.currentUser()!.id,
    }).subscribe({
      next: (res) => {
        this.messages.update(msgs => [...msgs, { role: 'assistant', text: res.reply }]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', text: 'Something went wrong. Please try again.' },
        ]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { /* noop */ }
  }
}
