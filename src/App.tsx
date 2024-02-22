import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

const BASE_URL = `https://tictactoe-be-jr76.onrender.com/`

type Score = {
	win: number
	lose: number
}

type Players = {

	player1: {
		name: string
		score: Score
	};
	player2: {
		name: string
		score: Score
	};
} & Partial<{ _id: string; createdAt: string; updatedAt: string; rounds: number; draw: number }> | undefined

function App() {
	return (
		<Router basename="/" future={{ v7_startTransition: true }}>
			<Routes>
				<Route path="/" element={<PlayersLists />} />
				<Route path="/register" element={<PlayersForm />} />
				<Route path="/playgame/:id" element={<Board />} />
			</Routes>
		</Router>
	);
}

const initNamesState = { player1: { name: '', score: { win: 0, lose: 0, draw: 0 } }, player2: { name: '', score: { win: 0, lose: 0, draw: 0 } } }
const initErrorsState = { error1: '', error2: '' }

function PlayersForm() {
	const [names, setNames] = useState(initNamesState);
	const [errors, setErrors] = useState(initErrorsState)
	const navigate = useNavigate()

	const id = JSON.parse(localStorage.getItem('id')!)

	if (id) return <Navigate to={'/playgame/' + id} />

	const inputChange = (e: any) => setNames({ ...names, [e.target.name]: { name: e.target.value, score: { win: 0, lose: 0, draw: 0 } } })

	return <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
		<div style={{ padding: '3rem', border: '5px double #808080', }}>
			<Link to='/' style={{ fontSize: 24, color: '#575757' }}>Back to score board</Link>
			<h1 style={{ textAlign: 'center' }}>Register Players</h1>
			<div style={{ display: 'flex', justifyContent: 'center', gap: '10rem' }}>
				<div style={{ display: 'grid', gap: 5 }}>
					<label htmlFor="player1" style={{ color: '#6b6b6b', fontSize: '1.4rem', fontWeight: 'bold' }}>Player 1</label>
					<input type="text" id="player1" placeholder="Enter Name..." style={{ padding: '.5rem', fontSize: '1.1rem', borderRadius: '5%', color: '#6b6b6b' }} name='player1' value={names?.player1?.name} onChange={inputChange} />
					<p style={{ color: 'red', margin: 0 }}>{errors?.error1 !== '' && errors?.error1}</p>
				</div>
				<div style={{ display: 'grid', gap: 5 }}>
					<label htmlFor="player2" style={{ color: '#808080', fontSize: '1.4rem', fontWeight: 'bold' }}>Player 2</label>
					<input type="text" id="player2" placeholder="Enter Name..." style={{ padding: '.5rem', fontSize: '1.1rem', borderRadius: '5%', color: '#6b6b6b' }} name='player2' value={names?.player2?.name} onChange={inputChange} />
					<p style={{ color: 'red', margin: 0 }}>{errors?.error2 !== '' && errors?.error2}</p>
				</div>
			</div >
			<div style={{ display: 'grid', placeItems: 'center', marginTop: '2rem' }}>
				<button style={{ textTransform: 'uppercase', letterSpacing: 1.2 }} onClick={async () => {
					setErrors(initErrorsState)
					if (!names.player1.name && !names.player2.name) {
						setErrors({ error1: 'Please enter valid name', error2: 'Please enter valid name' })
						return
					}
					else if (!names.player1.name || names.player1?.name.length <= 2) {
						setErrors({ error2: '', error1: 'Please enter valid name for player 1' })
						return
					} else if (!names.player2.name || names.player2?.name.length <= 2) {
						setErrors({ error1: '', error2: 'Please enter valid name for player 2' })
						return
					} else if (names.player1.name === names.player2.name) {
						setErrors({ error1: 'Cannot use same player name', error2: 'Cannot use same player name' })
						return
					} else {
						setErrors(initErrorsState)
						try {
							const players = { player1: names.player1.name, player2: names.player2.name }
							const res = await fetch(`${BASE_URL}/api/players`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(players) }) as any
							const data = await res.json()
							navigate('/playgame/' + data?._id!)
							localStorage.setItem('id', JSON.stringify(data?._id))
						} catch (error) {
							console.log('frontned error: ', error)
						}
					}
				}}>Start Game</button>
			</div>
		</div >
	</div>
}

const conditions = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6]
]

const Board = ({ }: any) => {
	const [reset, setReset] = useState(false)
	const [data, setData] = useState(Array(9).fill(''))
	const [current, setCurrent] = useState('X')
	const [players, setPlayers] = useState<Players | undefined>(undefined)
	const [loading, setLoading] = useState(true)
	const [winner, setWinner] = useState('')
	const navigate = useNavigate()
	const { id } = useParams()
	if (!id) return <Navigate to='/register' />

	const resetGame = () => {
		setData(Array(9).fill(''))
		setWinner('')
		setReset(false)
		getMatchPlayer()
	}

	useEffect(() => {
		if (reset) resetGame()
	}, [reset, setReset, setWinner, winner])

	useEffect(() => {
		const controller = new AbortController();
		getMatchPlayer(controller.signal)
		return () => {
			controller.abort()
		}
	}, [id])

	async function getMatchPlayer(signal?: AbortSignal) {
		setLoading(true)
		try {
			const res = await fetch(`${BASE_URL}/api/players/${id}`, { method: 'GET', signal }) as any
			const data = await res.json()
			setPlayers(data)
		} catch (error) {
			return error
		} finally {
			setLoading(false)
		}
	}

	async function updateMatchPlayer(id: string, winner: 'player1' | 'player2' | 'draw') {
		try {
			await fetch(`${BASE_URL}/api/players/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winner }) }) as any
		} catch (error) {
			return error
		}
	}

	const Draw = (index: number) => {
		if (winner) return
		if (data[index] === "") {
			const board = data;
			board[index] = current;
			setData(board)
			if (current === "X") {
				setCurrent("O")
			} else {
				setCurrent("X")
			}

			if (checkWin(board)) {
				if (current === "X") {
					setWinner(`${players?.player1.name} wins`)
					updateMatchPlayer(id, 'player1')
					return
				} else {
					setWinner(`${players?.player2.name} wins`)
					updateMatchPlayer(id, 'player2')
					return
				}
			}
			if (checkDraw(board)) {
				setWinner("Draw")
				updateMatchPlayer(id, 'draw')
			}
		}
	}

	const checkDraw = (board: any) => {
		let count = 0;
		board.forEach((element: any) => {
			if (element !== "") {
				count++;
			}
		})
		if (count >= 9) {
			return true;
		} else {
			return false;
		}
	}

	return (
		<div className="App">
			<div style={{ marginRight: 'auto' }}>
				<Link to='/' style={{ fontSize: 24, color: '#525252', paddingLeft: 20 }}>Back to scoring board</Link>
			</div>
			<div >
				<h1 style={{ fontSize: 60 }}>Round: {players?.rounds == 0 ? 1 : players?.rounds}</h1>
			</div>
			<div className={`winner ${winner !== "" ? "" : "shrink"}`}>
				<div className="winner-text">{winner}</div>
				<button disabled={loading} onClick={() => {
					if (loading) return
					resetGame()
				}}>Next Round</button>
				<button disabled={loading} onClick={() => {
					localStorage.clear()
					navigate('/')
				}}>Stop Game</button>
			</div>
			<div className='board'>
				{new Array(9).fill(undefined).map((_, idx) => (
					<div className={`input input${idx + 1}`} key={idx}
						onClick={() => Draw(idx)}>{data[idx]}
					</div>
				))}
			</div>
			<Players players={players} resetGame={resetGame} loading={loading} />
		</div>
	)
}

const PlayersLists = () => {
	const navigate = useNavigate()
	const [lists, setLists] = useState<Players[]>([])
	useEffect(() => {
		let cleanUp = false;
		(async () => {
			try {
				const res = await fetch(`${BASE_URL}/api/players`, { method: 'GET' })
				const data = await res.json()
				if (!cleanUp) setLists(data ?? [])

			} catch (error) {
				return error
			}
		})()
		return () => {
			cleanUp = true
		}
	}, [])
	const iDFromLocalStorage = JSON.parse(localStorage.getItem('id')!)
	return <>
		<h1 style={{ color: '#525252', textAlign: 'center', marginTop: 0, paddingTop: 20 }}>Tic Tac Toe Scoring Board</h1>
		<div style={{ textAlign: 'center', padding: 10 }}>
			<Link to={iDFromLocalStorage ? '/playgame/' + iDFromLocalStorage : '/register'} style={{ fontSize: 32, fontWeight: 'bold', color: '#525252' }}>{iDFromLocalStorage ? 'Continue Game' : 'Play Game'}</Link>
		</div >
		<table id="player-lists" style={{ textAlign: 'center' }}>
			<thead >
				<tr >
					<th>Players</th>
					<th>Score</th>
					<th>Rounds</th>
					<th>Draw</th>
					<th>Action</th>
				</tr>
			</thead>
			<h2 style={{ textAlign: 'center' }}>
				{!lists.length ? 'No players had played yet' : ''}
			</h2>
			<tbody>
				{lists.map((player: Players) => (
					<tr key={player?._id}>
						<td>
							{player?.player1.name} <br />
							{player?.player2.name}
						</td>
						<td>
							Win: {player?.player1?.score?.win} {" "}
							Lose: {player?.player1?.score?.lose}
							<br />
							Win: {player?.player2?.score?.win} {" "}
							Lose: {player?.player2?.score?.lose}
						</td>
						<td>{player?.rounds}</td>
						<td>{player?.draw}</td>
						<td >
							<button onClick={() => navigate('/playgame/' + player?._id)}>Rematch</button>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	</>
}

const Players = ({ players, resetGame, loading }: any) => {
	const navigate = useNavigate()
	return (
		<div style={{ display: 'grid', gap: 5 }}>
			<div className='players' style={{ marginBottom: 10 }}>
				<div className='player' style={{ display: 'grid' }}>
					<p style={{ marginTop: 0, marginBottom: 8 }}>{`${players?.player1?.name}: X`}</p>
					<div style={{ display: 'grid' }}>
						<i>
							Win: {players?.player1?.score.win}
						</i>
						<i>
							Lose: {players?.player1?.score.lose}
						</i>
					</div>
				</div>
				<div className='player' style={{ display: 'grid' }}>
					<p style={{ marginTop: 0, marginBottom: 8 }}>{`${players?.player2?.name}: X`}</p>
					<div style={{ display: 'grid' }}>
						<i>
							Win: {players?.player2?.score.win}
						</i>
						<i>
							Lose: {players?.player2?.score.lose}
						</i>
					</div>
				</div>
			</div>
			<div style={{ display: 'grid', placeItems: 'center', marginBottom: 0 }}>
				<div className="player" style={{ width: '60%' }}>
					Draw: {players?.draw ?? 0}
				</div>
			</div>
			<div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
				<button disabled={loading} onClick={() => {
					if (confirm('Are you sure you want to stop the current game?')) {
						localStorage.clear()
						navigate('/')
					}
				}}>Stop Game</button>
				<button disabled={loading} onClick={resetGame}>Restart Game</button>
				<button disabled={loading} onClick={async () => {
					if (confirm('Are you sure you want to clear game data?')) {
						try {
							await fetch(`${BASE_URL}/api/players/${players?._id}/clear`, { method: 'PUT' })
							resetGame()
						} catch (error) {
							return error
						}
					}
				}}>Clear Game Record</button>
			</div>
		</div>
	)
}

export default App;

const checkWin = (board: any) => {
	let flag = false;
	conditions.forEach((element: any) => {
		if (board[element[0]] !== ""
			&& board[element[1]] !== "" &&
			board[element[2]] !== "") {
			if (board[element[0]] === board[element[1]] &&
				board[element[1]] === board[element[2]]) {
				flag = true;
			}
		}
	})
	return flag;
}
