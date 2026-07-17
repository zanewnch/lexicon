import type { TranslationDirection } from '../shared/translationDirection'

export type TranslationPriority = 'interactive' | 'background'
export type TranslationJob = {
  id: string
  text: string
  direction: TranslationDirection
  priority: TranslationPriority
  group?: string
}

type PendingJob = TranslationJob & { run: () => Promise<unknown>; resolve: (value: unknown) => void; reject: (reason: unknown) => void }

/** Serialises model access while allowing user-facing jobs to overtake background work. */
export class TranslationJobScheduler {
  private readonly interactive: PendingJob[] = []
  private readonly background: PendingJob[] = []
  private running = false
  private cancelledGroups = new Set<string>()

  submit<T>(job: TranslationJob, run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const pending: PendingJob = { ...job, run, resolve: (value) => resolve(value as T), reject }
      ;(job.priority === 'interactive' ? this.interactive : this.background).push(pending)
      void this.drain()
    })
  }

  cancelGroup(group: string): void {
    this.cancelledGroups.add(group)
    this.removeCancelled(this.interactive, group)
    this.removeCancelled(this.background, group)
  }

  cancelGroups(prefix: string): void {
    const groups = new Set([...this.interactive, ...this.background].map((job) => job.group).filter((group): group is string => Boolean(group?.startsWith(prefix))))
    groups.forEach((group) => this.cancelGroup(group))
  }

  private removeCancelled(queue: PendingJob[], group: string): void {
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      if (queue[index].group === group) queue.splice(index, 1)[0].reject(new Error('翻譯工作已取消'))
    }
  }

  private async drain(): Promise<void> {
    if (this.running) return
    this.running = true
    try {
      while (true) {
        const job = this.interactive.shift() ?? this.background.shift()
        if (!job) return
        if (job.group && this.cancelledGroups.has(job.group)) continue
        try {
          const result = await job.run()
          if (job.group && this.cancelledGroups.has(job.group)) job.reject(new Error('翻譯工作已取消'))
          else job.resolve(result)
        } catch (error) { job.reject(error) }
      }
    } finally { this.running = false }
  }
}
