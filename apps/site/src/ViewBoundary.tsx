import { Component, type ErrorInfo, type ReactNode } from 'react'

/*
 * The host's half of `COMPOSE-002` and `COMPOSE-003`.
 *
 * Both interactive Views build their runtime inside a render-time memo, so a throw from construction unmounts the
 * tree that contains it - on this site that is the Diagram, the surrounding chrome and the draft's undo history
 * alike, which is why a refused route used to cost the whole page and leave no way back to the document that
 * caused it. Runtime construction not throwing for an accepted document is the product's obligation and this does
 * not substitute for it; what this buys is that a defect costs one surface rather than the page around it.
 */
export type ViewBoundaryProps = Readonly<{
  children: ReactNode
  /** Named in the notice, so a reader knows which surface failed rather than that something did. */
  surface: string
  /** Offered alongside the notice where the host has a way back, such as reloading a preset. */
  onRecover?: { label: string; recover: () => void }
}>

type ViewBoundaryState = Readonly<{ message: string | null }>

export class ViewBoundary extends Component<ViewBoundaryProps, ViewBoundaryState> {
  state: ViewBoundaryState = { message: null }

  static getDerivedStateFromError(error: unknown): ViewBoundaryState {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.surface} could not be drawn`, error, info.componentStack)
  }

  private readonly recover = () => {
    this.setState({ message: null })
    this.props.onRecover?.recover()
  }

  render() {
    const { message } = this.state
    if (message === null) return this.props.children

    return (
      <div className="view-boundary" role="alert">
        <h2 className="view-boundary-title">{this.props.surface} could not be drawn</h2>
        <p className="view-boundary-detail">{message}</p>
        {this.props.onRecover ? (
          <button onClick={this.recover} type="button">
            {this.props.onRecover.label}
          </button>
        ) : null}
      </div>
    )
  }
}
