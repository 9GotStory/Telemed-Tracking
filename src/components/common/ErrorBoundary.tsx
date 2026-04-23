import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-lg border bg-white p-8 max-w-md">
            <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
            <h2 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-muted-foreground mb-6">
              ไม่สามารถแสดงหน้านี้ได้ อาจเกิดจากระบบไม่สามารถเชื่อมต่อได้ชั่วคราว
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-muted p-3 rounded mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                โหลดหน้าใหม่
              </Button>
              <Button onClick={this.handleRetry} className="bg-apple-blue hover:bg-apple-blue/90">
                ลองอีกครั้ง
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
