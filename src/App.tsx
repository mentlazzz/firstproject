import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const stats = [
  { label: 'Revenue', value: '$45,231.89', change: '+20.1%' },
  { label: 'Subscriptions', value: '+2,350', change: '+180.1%' },
  { label: 'Active now', value: '+573', change: '+201' },
]

const team = [
  { name: 'Olivia Martin', email: 'olivia.martin@email.com', initials: 'OM' },
  { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', initials: 'IN' },
  { name: 'Sofia Davis', email: 'sofia.davis@email.com', initials: 'SD' },
]

function App() {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center gap-10 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="secondary">shadcn/ui</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Design system demo
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Cards, forms, badges and avatars styled with shadcn/ui's default
          "new-york" theme on top of Tailwind CSS v4.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-muted-foreground ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full">Login</Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </CardFooter>
        </Card>

        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="gap-3 py-4">
                <CardHeader className="px-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardDescription>{stat.label}</CardDescription>
                    <Badge variant="outline" className="shrink-0">
                      {stat.change}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{stat.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team members</CardTitle>
              <CardDescription>
                Invite your team to collaborate on this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {team.map((member, index) => (
                <div key={member.email}>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="" alt={member.name} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">
                        {member.name}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {member.email}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      Remove
                    </Button>
                  </div>
                  {index < team.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
